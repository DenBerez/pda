import React from 'react';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Box,
    Typography
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

interface DeleteConfirmationDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
    open,
    onClose,
    onConfirm
}) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    overflow: 'hidden',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)'
                }
            }}
            maxWidth="xs"
            fullWidth
        >
            <DialogTitle id="alert-dialog-title" sx={{ pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningAmberIcon color="error" />
                    <Typography variant="h6" component="span" fontWeight="medium">
                        Remove Widget?
                    </Typography>
                </Box>
            </DialogTitle>
            <DialogContent>
                <DialogContentText id="alert-dialog-description" sx={{ mb: 1 }}>
                    Are you sure you want to remove this widget? This action cannot be undone.
                </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    sx={{
                        minWidth: '80px',
                        borderRadius: '8px'
                    }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={onConfirm}
                    color="error"
                    variant="contained"
                    autoFocus
                    sx={{
                        minWidth: '80px',
                        borderRadius: '8px'
                    }}
                >
                    Remove
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DeleteConfirmationDialog; 