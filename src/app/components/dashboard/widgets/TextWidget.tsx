import { Box, Typography } from "@mui/material";
import { Widget } from "../types";
import { convertFromRaw, ContentBlock } from 'draft-js';
import { stateToHTML } from 'draft-js-export-html';
import React from "react";

interface TextWidgetProps {
    widget: Widget;
    editMode: boolean;
    onUpdateContent: (widgetId: string, content: string) => void;
    onUpdateWidget?: (widget: Widget) => void;
    showEditPanel?: boolean;
    setShowEditPanel?: React.Dispatch<React.SetStateAction<boolean>>;
}

const TextWidget = ({
    widget,
    editMode,
    onUpdateContent,
    onUpdateWidget,
    showEditPanel,
    setShowEditPanel
}: TextWidgetProps) => {
    // Custom component to render rich text in view mode
    const RichTextDisplay = React.useMemo(() => {
        try {
            const contentState = convertFromRaw(JSON.parse(widget.content || '{}'));
            if (!contentState.hasText()) {
                return { __html: '<p>No content</p>' };
            }

            // Configure options for stateToHTML
            const options = {
                inlineStyles: {
                    // Map all text color styles
                    ...Object.keys(widget.config?.styleMap || {})
                        .filter(key => key.startsWith('COLOR-'))
                        .reduce((obj, key) => ({
                            ...obj,
                            [key]: { style: { color: widget.config?.styleMap[key].color } }
                        }), {}),

                    // Map all background color styles
                    ...Object.keys(widget.config?.styleMap || {})
                        .filter(key => key.startsWith('BGCOLOR-'))
                        .reduce((obj, key) => ({
                            ...obj,
                            [key]: { style: { backgroundColor: widget.config?.styleMap[key].backgroundColor } }
                        }), {})
                },
                blockStyleFn: (block: ContentBlock) => {
                    const type = block.getType();
                    if (type.startsWith('align-')) {
                        return {
                            style: {
                                textAlign: type.split('-')[1]
                            }
                        };
                    }
                    return undefined;
                }
            };

            return { __html: stateToHTML(contentState, options) };
        } catch (e) {
            return { __html: '' };
        }
    }, [widget.content, widget.config?.styleMap]);

    return (
        <Box sx={{ height: '100%', overflow: 'auto' }}>
            <Typography
                variant="body1"
                component="div"
                sx={{
                    fontSize: widget.config?.fontSize === "x-small" ? "0.75rem" :
                        widget.config?.fontSize === "small" ? "0.875rem" :
                            widget.config?.fontSize === "large" ? "1.25rem" :
                                widget.config?.fontSize === "x-large" ? "1.5rem" : "1rem",
                    lineHeight: 1.6,
                    '& blockquote': {
                        borderLeft: '3px solid',
                        borderColor: 'divider',
                        paddingLeft: 2,
                        fontStyle: 'italic',
                        margin: '16px 0'
                    },
                    '& pre': {
                        backgroundColor: 'action.hover',
                        padding: 1,
                        borderRadius: 1,
                        fontFamily: 'monospace',
                        overflowX: 'auto'
                    },
                    '& ul, & ol': {
                        paddingLeft: 3,
                        marginBottom: 2
                    },
                    '& li': {
                        marginBottom: 0.5
                    },
                    '& p': {
                        marginBottom: 1.5
                    }
                }}
                dangerouslySetInnerHTML={RichTextDisplay}
            />
        </Box>
    );
};

export default TextWidget;