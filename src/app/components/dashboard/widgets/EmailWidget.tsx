import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    CircularProgress,
    List,
    ListItem,
    ListItemText,
    Divider,
    IconButton,
    Badge,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Button
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import MarkEmailUnreadIcon from '@mui/icons-material/MarkEmailUnread';
import { Widget } from '../types';
import Settings from '@mui/icons-material/Settings';
import LayoutStyleSelector from '../LayoutStyle';

interface Email {
    id: string;
    subject: string;
    from: string;
    date: string;
    snippet: string;
    unread: boolean;
}

interface EmailWidgetProps {
    widget: Widget;
    editMode: boolean;
    onUpdateWidget?: (updatedWidget: Widget) => void;
}

const EmailWidget: React.FC<EmailWidgetProps> = ({ widget, editMode, onUpdateWidget }) => {
    const [emails, setEmails] = useState<Email[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [provider, setProvider] = useState(widget.config?.provider || 'gmail');
    const [emailAddress, setEmailAddress] = useState(widget.config?.email || '');
    const [refreshToken, setRefreshToken] = useState(widget.config?.refreshToken || '');
    const [password, setPassword] = useState(widget.config?.password || '');
    const [configuring, setConfiguring] = useState(false);
    const [refreshInterval, setRefreshInterval] = useState(widget.config?.refreshInterval || 5);
    const [layoutOption, setLayoutOption] = useState(widget.config?.layoutOption || 'normal');

    // Function to fetch emails
    const fetchEmails = async () => {
        setLoading(true);
        setError(null);

        try {
            // Build the query parameters
            const params = new URLSearchParams({
                provider,
                maxResults: '5'
            });

            // Add provider-specific parameters
            if (provider === 'gmail' && refreshToken) {
                params.append('refreshToken', refreshToken);
            } else if (provider === 'aol' && emailAddress && password) {
                params.append('email', emailAddress);
                params.append('password', password);
            }

            const response = await fetch(`/api/email?${params.toString()}`);

            if (!response.ok) {
                throw new Error(`Failed to fetch emails: ${response.statusText}`);
            }

            const data = await response.json();
            setEmails(data.emails || []);
        } catch (err) {
            console.error('Error fetching emails:', err);
            setError('Failed to load emails. Please check your configuration.');
        } finally {
            setLoading(false);
        }
    };

    // Fetch emails on component mount and when configuration changes
    useEffect(() => {

        fetchEmails();

        // Set up refresh interval based on configuration
        const intervalId = setInterval(fetchEmails, refreshInterval * 60 * 1000);

        return () => clearInterval(intervalId);

    }, [editMode, provider, refreshToken, emailAddress, password, refreshInterval]);

    // Listen for Gmail auth success message
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'GMAIL_AUTH_SUCCESS' && event.data?.refreshToken) {
                // Update the refresh token
                setRefreshToken(event.data.refreshToken);

                // Update the widget configuration if onUpdateWidget is provided
                if (onUpdateWidget) {
                    onUpdateWidget({
                        ...widget,
                        config: {
                            ...widget.config,
                            provider: 'gmail',
                            refreshToken: event.data.refreshToken
                        }
                    });
                }

                // console.log('Gmail connected successfully!');
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [widget, onUpdateWidget]);

    // Format date to a more readable format
    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return dateString;
        }
    };

    // Extract sender name from email address
    const extractSenderName = (from: string) => {
        // If format is "Name <email@example.com>"
        const match = from.match(/^([^<]+)/);
        if (match && match[1].trim()) {
            return match[1].trim();
        }
        // If just an email address
        return from.split('@')[0];
    };

    // Toggle configuration mode
    const toggleConfiguration = () => {
        setConfiguring(!configuring);
    };

    // Save configuration
    const saveConfiguration = () => {
        // Update the widget configuration if onUpdateWidget is provided
        if (onUpdateWidget) {
            onUpdateWidget({
                ...widget,
                config: {
                    ...widget.config,
                    provider,
                    email: emailAddress,
                    refreshToken,
                    password,
                    refreshInterval,
                    layoutOption
                }
            });
        }

        setConfiguring(false);
        fetchEmails();
    };

    // Connect Gmail account
    const connectGmailAccount = () => {
        // Calculate center position for the popup
        const width = 600;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        // Open the auth window as a popup
        window.open(
            `/api/email/auth`,
            'gmail-auth-window',
            `width=${width},height=${height},left=${left},top=${top}`
        );
    };

    // Toggle email read status
    const toggleReadStatus = (emailId: string) => {
        setEmails(emails.map(email =>
            email.id === emailId
                ? { ...email, unread: !email.unread }
                : email
        ));
    };

    // Render configuration form
    const renderConfigurationForm = () => (
        <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
                Email Configuration
            </Typography>

            <FormControl fullWidth margin="normal" size="small">
                <InputLabel id="email-provider-label">Provider</InputLabel>
                <Select
                    labelId="email-provider-label"
                    value={provider}
                    label="Provider"
                    onChange={(e) => setProvider(e.target.value)}
                >
                    <MenuItem value="gmail">Gmail</MenuItem>
                    <MenuItem value="aol">AOL</MenuItem>
                </Select>
            </FormControl>

            {provider === 'gmail' ? (
                <>
                    <Box sx={{ mt: 2, mb: 2 }}>
                        {refreshToken ? (
                            <>
                                <Typography variant="body2" color="success.main" sx={{ mb: 1 }}>
                                    ✅ Your Gmail account is connected
                                </Typography>
                                <Button
                                    variant="outlined"
                                    color="error"
                                    size="small"
                                    onClick={() => setRefreshToken('')}
                                >
                                    Disconnect Account
                                </Button>
                            </>
                        ) : (
                            <>
                                <Typography variant="body2" sx={{ mb: 2 }}>
                                    Connect your Gmail account to display your emails.
                                </Typography>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={connectGmailAccount}
                                >
                                    Connect Gmail Account
                                </Button>
                            </>
                        )}
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                            {!refreshToken &&
                                "For demo purposes, you'll see mock email data if no account is connected."}
                        </Typography>
                    </Box>

                    <FormControl fullWidth margin="normal" size="small">
                        <InputLabel id="refresh-interval-label">Refresh Interval</InputLabel>
                        <Select
                            labelId="refresh-interval-label"
                            value={refreshInterval}
                            label="Refresh Interval"
                            onChange={(e) => setRefreshInterval(Number(e.target.value))}
                        >
                            <MenuItem value={1}>Every minute</MenuItem>
                            <MenuItem value={5}>Every 5 minutes</MenuItem>
                            <MenuItem value={15}>Every 15 minutes</MenuItem>
                            <MenuItem value={30}>Every 30 minutes</MenuItem>
                        </Select>
                    </FormControl>
                </>
            ) : (
                <>
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Email Address"
                        size="small"
                        value={emailAddress}
                        onChange={(e) => setEmailAddress(e.target.value)}
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Password"
                        type="password"
                        size="small"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        helperText="For demo purposes, leave empty to use mock data"
                    />
                </>
            )}

            <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
                Layout Style
            </Typography>
            <LayoutStyleSelector
                value={layoutOption}
                onChange={(newValue) => setLayoutOption(newValue)}
                helperText="Select how much email information to display"
            />

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                    variant="outlined"
                    onClick={toggleConfiguration}
                    sx={{ mr: 1 }}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={saveConfiguration}
                >
                    Save
                </Button>
            </Box>
        </Box>
    );

    // Render email list
    const renderEmailList = () => (
        <>
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 2,
                borderBottom: '1px solid',
                borderColor: 'divider'
            }}>
                <Typography variant="subtitle1" fontWeight="medium" sx={{
                    maxWidth: '80%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}>
                    {emailAddress || (provider === 'gmail' ? 'Gmail' : provider === 'aol' ? 'AOL' : 'Inbox')}
                </Typography>
                <IconButton
                    size="small"
                    onClick={fetchEmails}
                    disabled={loading}
                >
                    <RefreshIcon fontSize="small" />
                </IconButton>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress size={24} />
                </Box>
            ) : error ? (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography color="error" variant="body2">
                        {error}
                    </Typography>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={toggleConfiguration}
                        sx={{ mt: 1 }}
                    >
                        Configure
                    </Button>
                </Box>
            ) : emails.length === 0 ? (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2">
                        No emails found
                    </Typography>
                </Box>
            ) : (
                <List sx={{ p: 0 }}>
                    {emails.map((email, index) => (
                        <React.Fragment key={email.id}>
                            <ListItem
                                alignItems="flex-start"
                                sx={{
                                    px: 2,
                                    py: 1.5,
                                    bgcolor: email.unread ? 'action.hover' : 'transparent',
                                    '&:hover': {
                                        bgcolor: 'action.selected'
                                    }
                                }}
                            >
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography
                                                variant="body2"
                                                fontWeight={email.unread ? 'bold' : 'regular'}
                                                sx={{
                                                    maxWidth: '70%',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >
                                                {email.subject}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {formatDate(email.date)}
                                            </Typography>
                                        </Box>
                                    }
                                    secondary={
                                        <>
                                            <Typography
                                                component="span"
                                                variant="body2"
                                                color="text.primary"
                                                sx={{ display: 'block', fontWeight: email.unread ? 'medium' : 'regular' }}
                                            >
                                                {extractSenderName(email.from)}
                                            </Typography>
                                            <Typography
                                                component="span"
                                                variant="caption"
                                                color="text.secondary"
                                                sx={{
                                                    display: 'block',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >
                                                {email.snippet}
                                            </Typography>
                                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => toggleReadStatus(email.id)}
                                                    sx={{ p: 0.5 }}
                                                >
                                                    {email.unread ?
                                                        <MarkEmailReadIcon fontSize="small" /> :
                                                        <MarkEmailUnreadIcon fontSize="small" />
                                                    }
                                                </IconButton>
                                            </Box>
                                        </>
                                    }
                                />
                                {email.unread && (
                                    <Box sx={{ ml: 1, display: 'flex', alignItems: 'center' }}>
                                        <Badge color="primary" variant="dot" />
                                    </Box>
                                )}
                            </ListItem>
                            {index < emails.length - 1 && <Divider component="li" />}
                        </React.Fragment>
                    ))}
                </List>
            )}

            <Box sx={{
                p: 1.5,
                borderTop: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                justifyContent: 'center'
            }}>
                <Button
                    size="small"
                    onClick={toggleConfiguration}
                    startIcon={<Settings />}
                >
                    Configure Email
                </Button>
            </Box>
        </>
    );

    // Render compact email layout
    const renderCompactLayout = () => (
        <>
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 1.5,
                borderBottom: '1px solid',
                borderColor: 'divider'
            }}>
                <Typography variant="body1" fontWeight="medium" sx={{
                    maxWidth: '80%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}>
                    {emailAddress || (provider === 'gmail' ? 'Gmail' : provider === 'aol' ? 'AOL' : 'Inbox')}
                </Typography>
                <IconButton
                    size="small"
                    onClick={fetchEmails}
                    disabled={loading}
                >
                    <RefreshIcon fontSize="small" />
                </IconButton>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <CircularProgress size={20} />
                </Box>
            ) : error ? (
                <Box sx={{ p: 1.5, textAlign: 'center' }}>
                    <Typography color="error" variant="caption">
                        {error}
                    </Typography>
                </Box>
            ) : emails.length === 0 ? (
                <Box sx={{ p: 1.5, textAlign: 'center' }}>
                    <Typography variant="caption">
                        No emails found
                    </Typography>
                </Box>
            ) : (
                <List dense sx={{ p: 0 }}>
                    {emails.slice(0, 3).map((email, index) => (
                        <ListItem
                            key={email.id}
                            sx={{
                                px: 1.5,
                                py: 0.75,
                                bgcolor: email.unread ? 'action.hover' : 'transparent'
                            }}
                        >
                            <ListItemText
                                primary={
                                    <Typography
                                        variant="body2"
                                        fontWeight={email.unread ? 'bold' : 'regular'}
                                        sx={{
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {email.subject}
                                    </Typography>
                                }
                                secondary={
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {extractSenderName(email.from)}
                                    </Typography>
                                }
                            />
                            {email.unread && (
                                <Badge color="primary" variant="dot" />
                            )}
                        </ListItem>
                    ))}
                </List>
            )}

            <Box sx={{
                p: 1,
                borderTop: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                justifyContent: 'center'
            }}>
                <Button
                    size="small"
                    onClick={toggleConfiguration}
                    startIcon={<Settings />}
                    sx={{ fontSize: '0.75rem' }}
                >
                    Configure
                </Button>
            </Box>
        </>
    );

    // Render detailed email layout
    const renderDetailedLayout = () => (
        <>
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 2,
                borderBottom: '1px solid',
                borderColor: 'divider'
            }}>
                <Typography variant="subtitle1" fontWeight="medium" sx={{
                    maxWidth: '80%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}>
                    {emailAddress || (provider === 'gmail' ? 'Gmail' : provider === 'aol' ? 'AOL' : 'Inbox')}
                </Typography>
                <Box>
                    <IconButton
                        size="small"
                        onClick={fetchEmails}
                        disabled={loading}
                    >
                        <RefreshIcon fontSize="small" />
                    </IconButton>
                </Box>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress size={24} />
                </Box>
            ) : error ? (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography color="error" variant="body2">
                        {error}
                    </Typography>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={toggleConfiguration}
                        sx={{ mt: 1 }}
                    >
                        Configure
                    </Button>
                </Box>
            ) : emails.length === 0 ? (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2">
                        No emails found
                    </Typography>
                </Box>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'auto' }}>
                    <List sx={{ p: 0, flexGrow: 1 }}>
                        {emails.map((email, index) => (
                            <React.Fragment key={email.id}>
                                <ListItem
                                    alignItems="flex-start"
                                    sx={{
                                        px: 2,
                                        py: 2,
                                        bgcolor: email.unread ? 'action.hover' : 'transparent',
                                        '&:hover': {
                                            bgcolor: 'action.selected'
                                        }
                                    }}
                                >
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                                <Typography
                                                    variant="body1"
                                                    fontWeight={email.unread ? 'bold' : 'medium'}
                                                    sx={{
                                                        maxWidth: '70%',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    {email.subject}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {formatDate(email.date)}
                                                </Typography>
                                            </Box>
                                        }
                                        secondary={
                                            <>
                                                <Typography
                                                    component="span"
                                                    variant="body2"
                                                    color="text.primary"
                                                    sx={{ display: 'block', fontWeight: email.unread ? 'medium' : 'regular', mb: 0.5 }}
                                                >
                                                    {extractSenderName(email.from)}
                                                </Typography>
                                                <Typography
                                                    component="span"
                                                    variant="body2"
                                                    color="text.secondary"
                                                    sx={{
                                                        display: 'block',
                                                        mb: 1
                                                    }}
                                                >
                                                    {email.snippet}
                                                </Typography>
                                                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        onClick={() => toggleReadStatus(email.id)}
                                                        startIcon={email.unread ? <MarkEmailReadIcon /> : <MarkEmailUnreadIcon />}
                                                    >
                                                        Mark as {email.unread ? 'read' : 'unread'}
                                                    </Button>
                                                </Box>
                                            </>
                                        }
                                    />
                                    {email.unread && (
                                        <Box sx={{ ml: 1, display: 'flex', alignItems: 'flex-start', pt: 1 }}>
                                            <Badge color="primary" variant="dot" sx={{ transform: 'scale(1.2)' }} />
                                        </Box>
                                    )}
                                </ListItem>
                                {index < emails.length - 1 && <Divider component="li" />}
                            </React.Fragment>
                        ))}
                    </List>
                </Box>
            )}

            <Box sx={{
                p: 2,
                borderTop: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                justifyContent: 'center'
            }}>
                <Button
                    onClick={toggleConfiguration}
                    startIcon={<Settings />}
                >
                    Configure Email
                </Button>
            </Box>
        </>
    );

    return (
        <Box sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            bgcolor: 'background.paper',
            borderRadius: 1
        }}>
            {configuring ? renderConfigurationForm() : (
                layoutOption === 'compact' ? renderCompactLayout() :
                    layoutOption === 'detailed' ? renderDetailedLayout() :
                        renderEmailList()
            )}
        </Box>
    );
};

export default EmailWidget; 