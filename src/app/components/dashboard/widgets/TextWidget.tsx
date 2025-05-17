import { Box, Paper, IconButton, Tooltip, Divider } from "@mui/material";
import { useState, useCallback } from "react";
import { Widget } from "../types";
import {
    Editor,
    EditorState,
    RichUtils,
    convertToRaw,
    convertFromRaw,
} from 'draft-js';
import 'draft-js/dist/Draft.css';

// Import only essential formatting icons
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import CodeIcon from '@mui/icons-material/Code';

interface TextWidgetProps {
    editMode: boolean;
    widget: Widget;
    onUpdateContent: (widgetId: string, content: string) => void;
    onUpdateWidget?: (widget: Widget) => void;
    showEditPanel?: boolean;
    setShowEditPanel?: React.Dispatch<React.SetStateAction<boolean>>;
}

const TextWidget = ({ editMode, widget, onUpdateContent }: TextWidgetProps) => {
    // Initialize editor state from widget content or empty
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

    // Handle editor changes
    const handleEditorChange = useCallback((newState: EditorState) => {
        setEditorState(newState);
        const contentRaw = convertToRaw(newState.getCurrentContent());
        onUpdateContent(widget.id, JSON.stringify(contentRaw));
    }, [widget.id, onUpdateContent]);

    // Toggle formatting
    const toggleFormat = useCallback((style: string, isBlock = false) => {
        const newState = isBlock
            ? RichUtils.toggleBlockType(editorState, style)
            : RichUtils.toggleInlineStyle(editorState, style);
        handleEditorChange(newState);
    }, [editorState, handleEditorChange]);

    // Check active styles
    const hasStyle = (style: string, isBlock = false) => {
        if (isBlock) {
            const selection = editorState.getSelection();
            const block = editorState.getCurrentContent().getBlockForKey(selection.getStartKey());
            return block.getType() === style;
        }
        return editorState.getCurrentInlineStyle().has(style);
    };

    // Toolbar component
    const Toolbar = () => (
        <Paper
            elevation={0}
            sx={{
                mb: 1,
                p: 0.5,
                display: 'flex',
                gap: 0.5,
                bgcolor: 'background.paper',
                borderBottom: '1px solid',
                borderColor: 'divider'
            }}
        >
            <Tooltip title="Bold">
                <IconButton
                    size="small"
                    onClick={() => toggleFormat('BOLD')}
                    color={hasStyle('BOLD') ? "primary" : "default"}
                >
                    <FormatBoldIcon fontSize="small" />
                </IconButton>
            </Tooltip>

            <Tooltip title="Italic">
                <IconButton
                    size="small"
                    onClick={() => toggleFormat('ITALIC')}
                    color={hasStyle('ITALIC') ? "primary" : "default"}
                >
                    <FormatItalicIcon fontSize="small" />
                </IconButton>
            </Tooltip>

            <Tooltip title="Underline">
                <IconButton
                    size="small"
                    onClick={() => toggleFormat('UNDERLINE')}
                    color={hasStyle('UNDERLINE') ? "primary" : "default"}
                >
                    <FormatUnderlinedIcon fontSize="small" />
                </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem />

            <Tooltip title="Bullet List">
                <IconButton
                    size="small"
                    onClick={() => toggleFormat('unordered-list-item', true)}
                    color={hasStyle('unordered-list-item', true) ? "primary" : "default"}
                >
                    <FormatListBulletedIcon fontSize="small" />
                </IconButton>
            </Tooltip>

            <Tooltip title="Quote">
                <IconButton
                    size="small"
                    onClick={() => toggleFormat('blockquote', true)}
                    color={hasStyle('blockquote', true) ? "primary" : "default"}
                >
                    <FormatQuoteIcon fontSize="small" />
                </IconButton>
            </Tooltip>

            <Tooltip title="Code">
                <IconButton
                    size="small"
                    onClick={() => toggleFormat('code-block', true)}
                    color={hasStyle('code-block', true) ? "primary" : "default"}
                >
                    <CodeIcon fontSize="small" />
                </IconButton>
            </Tooltip>
        </Paper>
    );

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {editMode && <Toolbar />}

            <Box sx={{
                flexGrow: 1,
                overflow: 'auto',
                px: 2,
                py: 1,
                '& .DraftEditor-root': {
                    height: '100%'
                },
                '& .public-DraftEditor-content': {
                    height: '100%',
                    '& blockquote': {
                        borderLeft: '3px solid',
                        borderColor: 'divider',
                        margin: '16px 0',
                        padding: '0 16px',
                        fontStyle: 'italic'
                    },
                    '& pre': {
                        backgroundColor: 'action.hover',
                        padding: '8px',
                        borderRadius: '4px',
                        fontFamily: 'monospace'
                    }
                }
            }}>
                <Editor
                    editorState={editorState}
                    onChange={handleEditorChange}
                    readOnly={!editMode}
                    placeholder="Start typing here..."
                />
            </Box>
        </Box>
    );
};

export default TextWidget;