import React from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import DeleteIcon from '@mui/icons-material/Delete';

interface WidgetOptionsMenuProps {
    anchorEl: HTMLElement | null;
    open: boolean;
    onClose: () => void;
    activeWidgetId: string | null;
    onDeleteWidget: (widgetId: string) => void;
}

const WidgetOptionsMenu: React.FC<WidgetOptionsMenuProps> = ({
    anchorEl,
    open,
    onClose,
    activeWidgetId,
    onDeleteWidget
}) => {
    return (
        <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={onClose}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
            }}
        >
            <MenuItem
                onClick={() => activeWidgetId && onDeleteWidget(activeWidgetId)}
                sx={{ color: 'error.main' }}
            >
                <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                Remove Widget
            </MenuItem>
        </Menu>
    );
};

export default WidgetOptionsMenu; 