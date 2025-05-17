import React from 'react';
import { Box, Typography, Button } from '@mui/material';

interface AccountConnectionBoxProps {
    isConnected: boolean;
    serviceName: string;
    onConnect: () => void;
    onDisconnect: () => void;
    connectedMessage?: string;
    disconnectedMessage?: string;
    helperText?: string;
}

const AccountConnectionBox: React.FC<AccountConnectionBoxProps> = ({
    isConnected,
    serviceName,
    onConnect,
    onDisconnect,
    connectedMessage,
    disconnectedMessage,
    helperText
}) => {
    return (
        <Box
            sx={{
                textAlign: 'center',
                py: 2,
                mb: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                px: 2
            }}
        >
            {isConnected ? (
                <>
                    <Typography variant="body2" color="success.main" sx={{ mb: 2 }}>
                        ✅ {connectedMessage || `Your ${serviceName} account is connected`}
                    </Typography>
                    <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={onDisconnect}
                    >
                        Disconnect Account
                    </Button>
                </>
            ) : (
                <>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        {disconnectedMessage || `Connect your ${serviceName} account to display your data.`}
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={onConnect}
                    >
                        Connect {serviceName} Account
                    </Button>
                </>
            )}
            {helperText && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    {helperText}
                </Typography>
            )}
        </Box>
    );
};

export default AccountConnectionBox; 