import { Box, Typography, Divider, Paper, IconButton, Tooltip, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import { useState, useCallback, forwardRef, useImperativeHandle } from "react";
import { Widget } from "../types";
import {
    Editor,
    EditorState,
    RichUtils,
    convertToRaw,
    convertFromRaw,
    ContentState
} from 'draft-js';
import 'draft-js/dist/Draft.css';
import EditIcon from '@mui/icons-material/Edit';
import WidgetEditPanel from "../EditWidgetsPanel";
import React from "react";
import { stateToHTML } from 'draft-js-export-html';

// Import icons for the toolbar
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import CodeIcon from '@mui/icons-material/Code';
import FormatColorTextIcon from '@mui/icons-material/FormatColorText';
import FormatColorFillIcon from '@mui/icons-material/FormatColorFill';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import FormatAlignJustifyIcon from '@mui/icons-material/FormatAlignJustify';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { Popover, Grid, Slider } from "@mui/material";

// Define custom style map for the editor
const styleMap: Record<string, React.CSSProperties> = {
    // Text colors
    'COLOR-FF0000': { color: '#FF0000' },
    'COLOR-00FF00': { color: '#00FF00' },
    'COLOR-0000FF': { color: '#0000FF' },
    'COLOR-FFFF00': { color: '#FFFF00' },
    'COLOR-FF00FF': { color: '#FF00FF' },
    'COLOR-00FFFF': { color: '#00FFFF' },
    'COLOR-000000': { color: '#000000' },
    'COLOR-FFFFFF': { color: '#FFFFFF' },
    'COLOR-808080': { color: '#808080' },

    // Background colors
    'BGCOLOR-FF0000': { backgroundColor: '#FF0000' },
    'BGCOLOR-00FF00': { backgroundColor: '#00FF00' },
    'BGCOLOR-0000FF': { backgroundColor: '#0000FF' },
    'BGCOLOR-FFFF00': { backgroundColor: '#FFFF00' },
    'BGCOLOR-FF00FF': { backgroundColor: '#FF00FF' },
    'BGCOLOR-00FFFF': { backgroundColor: '#00FFFF' },
    'BGCOLOR-000000': { backgroundColor: '#000000' },
    'BGCOLOR-FFFFFF': { backgroundColor: '#FFFFFF' },
    'BGCOLOR-transparent': { backgroundColor: 'transparent' },
};

const TextWidget = ({
    editMode,
    widget,
    onUpdateContent,
    onUpdateWidget,
    showEditPanel,
    setShowEditPanel
}: {
    editMode: boolean,
    widget: Widget,
    onUpdateContent: (widgetId: string, content: string) => void,
    onUpdateWidget?: (updatedWidget: Widget) => void,
    showEditPanel?: boolean,
    setShowEditPanel?: (show: boolean) => void
}) => {
    // Use external state if provided, otherwise use local state
    const [localShowEditPanel, setLocalShowEditPanel] = useState(false);

    // Use the external state if provided, otherwise use local state
    const editPanelOpen = showEditPanel !== undefined ? showEditPanel : localShowEditPanel;
    const setEditPanelOpen = setShowEditPanel || setLocalShowEditPanel;

    // Initialize editor state from widget content or with empty content
    const [editorState, setEditorState] = useState(() => {
        if (widget.content) {
            try {
                const contentState = convertFromRaw(JSON.parse(widget.content));
                return EditorState.createWithContent(contentState);
            } catch (e) {
                return EditorState.createEmpty();
            }
        }
        return EditorState.createEmpty();
    });

    // Update the fontSize state to include more options
    const [fontSize, setFontSize] = useState("medium");

    // Add these state variables
    const [textColor, setTextColor] = useState("#000000");
    const [bgColor, setBgColor] = useState("transparent");
    const [textAlignment, setTextAlignment] = useState("left");
    const [colorPickerAnchor, setColorPickerAnchor] = useState<null | HTMLElement>(null);
    const [colorPickerType, setColorPickerType] = useState<'text' | 'background' | null>(null);

    const handleEditorChange = useCallback((newState: EditorState) => {
        setEditorState(newState);

        // Convert editor content to JSON string and update parent
        const contentRaw = convertToRaw(newState.getCurrentContent());
        const contentString = JSON.stringify(contentRaw);
        onUpdateContent(widget.id, contentString);
    }, [widget.id, onUpdateContent]);

    // Handle keyboard commands like Ctrl+B for bold
    const handleKeyCommand = useCallback((command: string) => {
        const newState = RichUtils.handleKeyCommand(editorState, command);
        if (newState) {
            handleEditorChange(newState);
            return 'handled';
        }
        return 'not-handled';
    }, [editorState, handleEditorChange]);

    // Toggle inline styles (bold, italic, underline, etc.)
    const toggleInlineStyle = useCallback((style: string) => {
        handleEditorChange(RichUtils.toggleInlineStyle(editorState, style));
    }, [editorState, handleEditorChange]);

    // Toggle block types (lists, quotes, etc.)
    const toggleBlockType = useCallback((blockType: string) => {
        handleEditorChange(RichUtils.toggleBlockType(editorState, blockType));
    }, [editorState, handleEditorChange]);

    // Check if the current selection has a specific inline style
    const hasInlineStyle = (style: string) => {
        return editorState.getCurrentInlineStyle().has(style);
    };

    // Check if the current selection has a specific block type
    const hasBlockType = (blockType: string) => {
        const selection = editorState.getSelection();
        const blockKey = selection.getStartKey();
        const block = editorState.getCurrentContent().getBlockForKey(blockKey);
        return block.getType() === blockType;
    };

    // Handle font size change
    const handleFontSizeChange = (event: any) => {
        setFontSize(event.target.value);
    };

    // Add this function to preserve selection when clicking toolbar buttons
    const handleToolbarMouseDown = (e: React.MouseEvent) => {
        // Prevent the default behavior that would cause the editor to lose focus
        e.preventDefault();
    };

    // Open color picker
    const handleOpenColorPicker = (event: React.MouseEvent<HTMLElement>, type: 'text' | 'background') => {
        // Prevent the default behavior and stop propagation
        event.preventDefault();
        event.stopPropagation();

        // Set the anchor and type in a single update
        setColorPickerAnchor(event.currentTarget);
        setColorPickerType(type);
    };

    // Close color picker
    const handleCloseColorPicker = () => {
        setColorPickerAnchor(null);
        setColorPickerType(null);
    };

    // Apply text color
    const applyTextColor = useCallback((color: string) => {
        // Batch state updates
        const colorStyleName = `COLOR-${color.replace('#', '')}`;
        let nextEditorState = editorState;

        // Remove existing color styles
        const currentStyles = editorState.getCurrentInlineStyle();
        Object.keys(styleMap).forEach(style => {
            if (style.startsWith('COLOR-') && currentStyles.has(style)) {
                nextEditorState = RichUtils.toggleInlineStyle(nextEditorState, style);
            }
        });

        // Apply new color style
        nextEditorState = RichUtils.toggleInlineStyle(nextEditorState, colorStyleName);

        // Update editor state
        handleEditorChange(nextEditorState);

        // Update color state and close picker after editor update
        setTextColor(color);
        setColorPickerAnchor(null);
        setColorPickerType(null);
    }, [editorState, handleEditorChange, styleMap]);

    // Apply background color - completely refactored
    const applyBgColor = useCallback((color: string) => {
        // First close the color picker
        setColorPickerAnchor(null);
        setColorPickerType(null);

        // Update the color state
        setBgColor(color);

        // Create the style name
        const bgColorStyleName = `BGCOLOR-${color.replace('#', '')}`;

        // Get current selection
        const selection = editorState.getSelection();

        // Only proceed if there's a selection or cursor position
        if (!selection.isCollapsed() || true) {
            // Get current content
            let contentState = editorState.getCurrentContent();

            // First remove any existing background color styles
            const currentStyles = editorState.getCurrentInlineStyle();

            // Create a new EditorState that forces the color
            let nextEditorState = editorState;

            // Remove all existing background color styles
            Object.keys(styleMap).forEach(style => {
                if (style.startsWith('BGCOLOR-') && currentStyles.has(style)) {
                    nextEditorState = RichUtils.toggleInlineStyle(nextEditorState, style);
                }
            });

            // Apply the new background color style
            nextEditorState = RichUtils.toggleInlineStyle(nextEditorState, bgColorStyleName);

            // Update the editor state through our handler
            handleEditorChange(nextEditorState);
        }
    }, [editorState, handleEditorChange]);

    const applyTextAlignment = useCallback((alignment: string) => {
        // Update alignment state
        setTextAlignment(alignment);

        const alignmentType = `align-${alignment}`;
        const newState = RichUtils.toggleBlockType(editorState, alignmentType);

        // Use handleEditorChange to update both local state and parent component
        handleEditorChange(newState);
    }, [editorState, handleEditorChange]);

    // Custom component to render rich text in view mode
    const RichTextDisplay = useCallback(() => {
        const contentState = editorState.getCurrentContent();
        if (!contentState.hasText()) {
            return <Typography variant="body1" color="text.secondary">No content</Typography>;
        }

        // Add this function to convert Draft.js content to HTML
        const createMarkup = () => {
            // Configure options for stateToHTML
            const options = {
                inlineStyles: {
                    // Map all text color styles
                    ...Object.keys(styleMap)
                        .filter(key => key.startsWith('COLOR-'))
                        .reduce((obj, key) => ({
                            ...obj,
                            [key]: { style: { color: styleMap[key].color } }
                        }), {}),

                    // Map all background color styles
                    ...Object.keys(styleMap)
                        .filter(key => key.startsWith('BGCOLOR-'))
                        .reduce((obj, key) => ({
                            ...obj,
                            [key]: { style: { backgroundColor: styleMap[key].backgroundColor } }
                        }), {})
                },
                blockStyleFn: (block) => {
                    const type = block.getType();
                    if (type.startsWith('align-')) {
                        return {
                            style: {
                                textAlign: type.split('-')[1]
                            }
                        };
                    }
                    return null;
                }
            };

            return { __html: stateToHTML(contentState, options) };
        };

        return (
            <Typography
                variant="body1"
                component="div"
                sx={{
                    fontSize: fontSize === "x-small" ? "0.75rem" :
                        fontSize === "small" ? "0.875rem" :
                            fontSize === "large" ? "1.25rem" :
                                fontSize === "x-large" ? "1.5rem" : "1rem",
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
                        fontFamily: 'var(--font-geist-mono), monospace',
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
                    },
                    '& h1, & h2': {
                        marginBottom: 2,
                        marginTop: 2
                    }
                }}
                dangerouslySetInnerHTML={createMarkup()}
            />
        );
    }, [editorState, fontSize]);

    // Define block style function for text alignment
    const getBlockStyle = (block: any) => {
        const type = block.getType();
        if (type.startsWith('align-')) {
            return `text-align-${type.split('-')[1]}`;
        }
        return '';
    };

    // Color picker component
    const ColorPicker = useCallback(() => {
        const colors = [
            '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
            '#FF00FF', '#00FFFF', '#000000', '#FFFFFF',
            '#808080', ...(colorPickerType === 'background' ? ['transparent'] : [])
        ];

        return (
            <Popover
                open={Boolean(colorPickerAnchor)}
                anchorEl={colorPickerAnchor}
                onClose={handleCloseColorPicker}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}
                onClick={(e) => e.stopPropagation()}
                // Use mousedown instead of click to prevent focus issues
                onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }}
                // Add this to prevent closing when clicking inside
                disableRestoreFocus
                // Add this to prevent editor focus loss
                disableEnforceFocus
            >
                <Grid container spacing={1} sx={{ p: 1, width: 200 }}>
                    {colors.map((color) => (
                        <Grid item key={color} xs={3}>
                            <Box
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (colorPickerType === 'text') {
                                        applyTextColor(color);
                                    } else {
                                        applyBgColor(color);
                                    }
                                }}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                                sx={{
                                    width: 30,
                                    height: 30,
                                    backgroundColor: color === 'transparent' ? 'transparent' : color,
                                    border: '1px solid #ccc',
                                    cursor: 'pointer',
                                    borderRadius: 1,
                                    '&:hover': {
                                        opacity: 0.8,
                                    },
                                    ...(color === 'transparent' && {
                                        backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)',
                                        backgroundSize: '10px 10px',
                                        backgroundPosition: '0 0, 5px 5px',
                                    })
                                }}
                            />
                        </Grid>
                    ))}
                </Grid>
            </Popover>
        );
    }, [colorPickerAnchor, colorPickerType, applyTextColor, applyBgColor, handleCloseColorPicker]);

    // Handle saving widget from edit panel
    const handleSaveWidget = (updatedWidget: Widget) => {
        if (onUpdateWidget) {
            onUpdateWidget(updatedWidget);
        }
        setEditPanelOpen(false);
    };

    // Render the text formatting toolbar
    const TextFormattingToolbar: React.FC = () => (
        <Paper
            elevation={0}
            sx={{
                mb: 1,
                p: 0.5,
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                bgcolor: 'background.paper',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider'
            }}
            onMouseDown={handleToolbarMouseDown}
        >
            {/* Formatting toolbar */}
            <Tooltip title="Bold">
                <IconButton
                    size="small"
                    onClick={() => toggleInlineStyle('BOLD')}
                    color={hasInlineStyle('BOLD') ? "primary" : "default"}
                >
                    <FormatBoldIcon fontSize="small" />
                </IconButton>
            </Tooltip>

            <Tooltip title="Italic">
                <IconButton
                    size="small"
                    onClick={() => toggleInlineStyle('ITALIC')}
                    color={hasInlineStyle('ITALIC') ? "primary" : "default"}
                >
                    <FormatItalicIcon fontSize="small" />
                </IconButton>
            </Tooltip>

            <Tooltip title="Underline">
                <IconButton
                    size="small"
                    onClick={() => toggleInlineStyle('UNDERLINE')}
                    color={hasInlineStyle('UNDERLINE') ? "primary" : "default"}
                >
                    <FormatUnderlinedIcon fontSize="small" />
                </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

            <Tooltip title="Bulleted List">
                <IconButton
                    size="small"
                    onClick={() => toggleBlockType('unordered-list-item')}
                    color={hasBlockType('unordered-list-item') ? "primary" : "default"}
                >
                    <FormatListBulletedIcon fontSize="small" />
                </IconButton>
            </Tooltip>

            <Tooltip title="Numbered List">
                <IconButton
                    size="small"
                    onClick={() => toggleBlockType('ordered-list-item')}
                    color={hasBlockType('ordered-list-item') ? "primary" : "default"}
                >
                    <FormatListNumberedIcon fontSize="small" />
                </IconButton>
            </Tooltip>

            <Tooltip title="Quote">
                <IconButton
                    size="small"
                    onClick={() => toggleBlockType('blockquote')}
                    color={hasBlockType('blockquote') ? "primary" : "default"}
                >
                    <FormatQuoteIcon fontSize="small" />
                </IconButton>
            </Tooltip>

            <Tooltip title="Code Block">
                <IconButton
                    size="small"
                    onClick={() => toggleBlockType('code-block')}
                    color={hasBlockType('code-block') ? "primary" : "default"}
                >
                    <CodeIcon fontSize="small" />
                </IconButton>
            </Tooltip>

            {/* After the existing formatting buttons, add a divider */}
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

            {/* Text alignment buttons */}
            <Tooltip title="Align Left">
                <IconButton
                    size="small"
                    onClick={() => applyTextAlignment('left')}
                    color={hasBlockType('align-left') ? "primary" : "default"}
                >
                    <FormatAlignLeftIcon fontSize="small" />
                </IconButton>
            </Tooltip>

            <Tooltip title="Align Center">
                <IconButton
                    size="small"
                    onClick={() => applyTextAlignment('center')}
                    color={hasBlockType('align-center') ? "primary" : "default"}
                >
                    <FormatAlignCenterIcon fontSize="small" />
                </IconButton>
            </Tooltip>

            <Tooltip title="Align Right">
                <IconButton
                    size="small"
                    onClick={() => applyTextAlignment('right')}
                    color={hasBlockType('align-right') ? "primary" : "default"}
                >
                    <FormatAlignRightIcon fontSize="small" />
                </IconButton>
            </Tooltip>

            <Tooltip title="Justify">
                <IconButton
                    size="small"
                    onClick={() => applyTextAlignment('justify')}
                    color={hasBlockType('align-justify') ? "primary" : "default"}
                >
                    <FormatAlignJustifyIcon fontSize="small" />
                </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

            {/* Text color button */}
            <Tooltip title="Text Color">
                <IconButton
                    size="small"
                    onClick={(e) => handleOpenColorPicker(e, 'text')}
                    sx={{
                        color: textColor !== "#000000" ? textColor : "default",
                        '& .MuiSvgIcon-root': { color: textColor !== "#000000" ? textColor : undefined }
                    }}
                >
                    <FormatColorTextIcon fontSize="small" />
                </IconButton>
            </Tooltip>

            {/* Background color button */}
            <Tooltip title="Background Color">
                <IconButton
                    size="small"
                    onClick={(e) => handleOpenColorPicker(e, 'background')}
                    sx={{
                        bgcolor: bgColor !== "transparent" ? bgColor : undefined,
                        '& .MuiSvgIcon-root': {
                            color: bgColor !== "transparent" ? (theme) =>
                                theme.palette.getContrastText(bgColor) : undefined
                        }
                    }}
                >
                    <FormatColorFillIcon fontSize="small" />
                </IconButton>
            </Tooltip>

            {/* Render the color picker */}
            <ColorPicker />

            {/* Expand the font size options */}
            <FormControl size="small" sx={{ minWidth: 120, ml: 1 }}>
                <InputLabel id="font-size-select-label">Size</InputLabel>
                <Select
                    labelId="font-size-select-label"
                    id="font-size-select"
                    value={fontSize}
                    label="Size"
                    onChange={handleFontSizeChange}
                    size="small"
                >
                    <MenuItem value="x-small">X-Small</MenuItem>
                    <MenuItem value="small">Small</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="large">Large</MenuItem>
                    <MenuItem value="x-large">X-Large</MenuItem>
                </Select>
            </FormControl>
        </Paper>
    );

    return (
        <Box sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative'
        }}>


            {/* Show edit panel when in edit mode and panel is open */}
            {editMode && editPanelOpen && (
                <WidgetEditPanel
                    open={editPanelOpen}
                    widget={widget}
                    onClose={() => setEditPanelOpen(false)}
                    onSave={handleSaveWidget}
                >
                    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Text Content
                        </Typography>

                        {/* Text formatting toolbar */}
                        <TextFormattingToolbar />

                        {/* Editor */}
                        <Box sx={{
                            flexGrow: 1,
                            padding: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            bgcolor: 'background.paper',
                            overflow: 'auto',
                            '& .DraftEditor-root': {
                                height: '100%',
                            },
                            '& .public-DraftEditor-content': {
                                minHeight: '100px',
                                fontSize: fontSize === "x-small" ? "0.75rem" :
                                    fontSize === "small" ? "0.875rem" :
                                        fontSize === "large" ? "1.25rem" :
                                            fontSize === "x-large" ? "1.5rem" : "1rem",
                            }
                        }}>
                            <Editor
                                editorState={editorState}
                                onChange={handleEditorChange}
                                handleKeyCommand={handleKeyCommand}
                                placeholder="Start typing here..."
                                customStyleMap={styleMap}
                                blockStyleFn={getBlockStyle}
                            />
                        </Box>
                    </Box>
                </WidgetEditPanel>
            )}

            {/* Display the rich text content when not editing */}

            <Box sx={{ height: '100%', overflow: 'auto' }}>
                <RichTextDisplay />
            </Box>

        </Box>
    );
};

export default TextWidget;