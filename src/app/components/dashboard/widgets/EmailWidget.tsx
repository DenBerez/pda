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
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import MarkEmailUnreadIcon from '@mui/icons-material/MarkEmailUnread';
import { Widget } from '../types';
import Settings from '@mui/icons-material/Settings';
import LayoutStyleSelector from '../LayoutStyle';
import { useOAuth2Connection } from '../../../hooks/useOAuth2Connection';
import CloseIcon from '@mui/icons-material/Close';
import ReplyIcon from '@mui/icons-material/Reply';

interface Email {
    id: string;
    subject: string;
    from: string;
    date: string;
    snippet: string;
    body?: string;
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
    const [password, setPassword] = useState('');
    const [configuring, setConfiguring] = useState(false);
    const [refreshInterval, setRefreshInterval] = useState(widget.config?.refreshInterval || 5);
    const [layoutOption, setLayoutOption] = useState(widget.config?.layoutOption || 'normal');
    const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    const { refreshToken, isConnected, connect, disconnect } = useOAuth2Connection({
        widget,
        messageType: 'GMAIL_AUTH_SUCCESS',
        authEndpoint: '/api/email/auth',
        onUpdateWidget
    });

    // Function to fetch emails
    const fetchEmails = async () => {
        setLoading(true);
        setError(null);

        try {
            // Build the query parameters
            const params = new URLSearchParams({
                provider,
                maxResults: '5',
                fullContent: 'true' // Request full email content
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

    // Fetch user profile to get email address
    const fetchUserProfile = async () => {
        if (!refreshToken) return;

        try {
            // For demo purposes, we'll simulate fetching the profile
            // In a real implementation, you would call an API endpoint
            if (process.env.NODE_ENV === 'development') {
                // Simulate API call in development
                setTimeout(() => {
                    if (refreshToken && !emailAddress) {
                        const mockEmail = 'user@gmail.com';
                        setEmailAddress(mockEmail);

                        // Update widget config
                        if (onUpdateWidget) {
                            onUpdateWidget({
                                ...widget,
                                config: {
                                    ...widget.config,
                                    email: mockEmail
                                }
                            });
                        }
                    }
                }, 500);
                return;
            }

            // In production, make an actual API call
            const response = await fetch(`/api/email/profile?refreshToken=${refreshToken}`);

            if (!response.ok) {
                throw new Error(`Failed to fetch user profile: ${response.statusText}`);
            }

            const data = await response.json();
            if (data.email) {
                setEmailAddress(data.email);

                // Update widget config
                if (onUpdateWidget) {
                    onUpdateWidget({
                        ...widget,
                        config: {
                            ...widget.config,
                            email: data.email
                        }
                    });
                }
            }
        } catch (err) {
            console.error('Error fetching user profile:', err);
        }
    };

    // Listen for auth messages that might include email
    useEffect(() => {
        const handleAuthMessage = (event: MessageEvent) => {
            if (event.data?.type === 'GMAIL_AUTH_SUCCESS' &&
                event.data?.widgetId === widget.id &&
                event.data?.email) {

                setEmailAddress(event.data.email);

                // Update widget config
                if (onUpdateWidget) {
                    onUpdateWidget({
                        ...widget,
                        config: {
                            ...widget.config,
                            email: event.data.email
                        }
                    });
                }
            }
        };

        window.addEventListener('message', handleAuthMessage);
        return () => window.removeEventListener('message', handleAuthMessage);
    }, [widget.id, onUpdateWidget]);

    // Fetch emails on component mount and when configuration changes
    useEffect(() => {
        fetchEmails();

        // If we have a refresh token but no email address, fetch the user profile
        if (refreshToken && !emailAddress && provider === 'gmail') {
            fetchUserProfile();
        }

        // Set up refresh interval based on configuration
        const intervalId = setInterval(fetchEmails, refreshInterval * 60 * 1000);

        return () => clearInterval(intervalId);
    }, [editMode, provider, refreshToken, emailAddress, password, refreshInterval]);

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

    // Extract username from email address
    const extractUsername = (email: string) => {
        if (!email) return '';
        return email.split('@')[0];
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
                    refreshInterval,
                    layoutOption
                }
            });
        }

        setConfiguring(false);
        fetchEmails();
    };

    // Toggle email read status
    const toggleReadStatus = async (emailId: string) => {
        try {
            // Get the current email to determine new status
            const email = emails.find(e => e.id === emailId);
            if (!email) return;

            const newStatus = !email.unread;

            // Update local state immediately for responsive UI
            setEmails(emails.map(e =>
                e.id === emailId
                    ? { ...e, unread: newStatus }
                    : e
            ));

            // For development or demo mode, don't make actual API calls
            if (process.env.NODE_ENV === 'development' || !refreshToken) {
                console.log('Development mode: Email status updated locally only');
                return;
            }

            // Create request body instead of using query parameters
            const requestBody = {
                provider,
                emailId,
                markAs: newStatus ? 'unread' : 'read',
                refreshToken: provider === 'gmail' ? refreshToken : undefined,
                email: provider === 'aol' ? emailAddress : undefined,
                password: provider === 'aol' ? password : undefined
            };

            // Make API call to update status
            const response = await fetch(`/api/email/status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                // If server update fails, revert the local state
                setEmails(emails.map(e =>
                    e.id === emailId
                        ? { ...e, unread: email.unread }
                        : e
                ));

                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || response.statusText;
                console.error(`Failed to update email status: ${errorMessage}`);
            }
        } catch (err) {
            console.error('Error updating email status:', err);
        }
    };

    // Open email dialog and mark as read if unread
    const openEmailDialog = async (email: Email) => {
        // If email content isn't loaded yet, fetch it first
        if (!email.body) {
            setLoading(true);
            try {
                await fetchEmailContent(email.id);
                // Get the updated email with body from the emails state
                const updatedEmail = emails.find(e => e.id === email.id);
                if (updatedEmail) {
                    email = updatedEmail;
                }
            } catch (err) {
                console.error('Error loading email content:', err);
            } finally {
                setLoading(false);
            }
        }

        setSelectedEmail(email);
        setDialogOpen(true);

        // Mark as read if currently unread
        if (email.unread) {
            toggleReadStatus(email.id);
        }
    };

    // Close email dialog
    const closeEmailDialog = () => {
        setDialogOpen(false);
        setSelectedEmail(null);
    };

    // Fetch full email content
    const fetchEmailContent = async (emailId: string) => {
        try {
            // Build the query parameters
            const params = new URLSearchParams({
                provider,
                emailId,
                fullContent: 'true'
            });

            // Add provider-specific parameters
            if (provider === 'gmail' && refreshToken) {
                params.append('refreshToken', refreshToken);
            } else if (provider === 'aol' && emailAddress && password) {
                params.append('email', emailAddress);
                params.append('password', password);
            }

            const response = await fetch(`/api/email/content?${params.toString()}`);

            if (!response.ok) {
                throw new Error(`Failed to fetch email content: ${response.statusText}`);
            }

            const data = await response.json();

            // Update the email in the emails array
            setEmails(emails.map(email =>
                email.id === emailId
                    ? { ...email, body: data.body }
                    : email
            ));

            // Update selected email if it's the one being viewed
            if (selectedEmail && selectedEmail.id === emailId) {
                setSelectedEmail(prev => prev ? { ...prev, body: data.body } : null);
            }

            return data.body;
        } catch (err) {
            console.error('Error fetching email content:', err);
            throw err;
        }
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
                        {isConnected ? (
                            <>
                                <Typography variant="body2" color="success.main" sx={{ mb: 1 }}>
                                    ✅ Your Gmail account is connected
                                </Typography>
                                <Button
                                    variant="outlined"
                                    color="error"
                                    size="small"
                                    onClick={disconnect}
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
                                    onClick={connect}
                                >
                                    Connect Gmail Account
                                </Button>
                            </>
                        )}
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                            {!isConnected &&
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
                    {emailAddress ? extractUsername(emailAddress) : (isConnected ? 'Connected Gmail Account' : provider === 'gmail' ? 'Gmail' : provider === 'aol' ? 'AOL' : 'Inbox')}
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
                                        bgcolor: 'action.selected',
                                        cursor: 'pointer'
                                    }
                                }}
                                onClick={() => openEmailDialog(email)}
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
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleReadStatus(email.id);
                                                    }}
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
                    {emailAddress ? extractUsername(emailAddress) : (isConnected ? 'Connected Gmail Account' : provider === 'gmail' ? 'Gmail' : provider === 'aol' ? 'AOL' : 'Inbox')}
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
                                bgcolor: email.unread ? 'action.hover' : 'transparent',
                                '&:hover': {
                                    bgcolor: 'action.selected',
                                    cursor: 'pointer'
                                }
                            }}
                            onClick={() => openEmailDialog(email)}
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
                    {emailAddress ? extractUsername(emailAddress) : (isConnected ? 'Connected Gmail Account' : provider === 'gmail' ? 'Gmail' : provider === 'aol' ? 'AOL' : 'Inbox')}
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
                                            bgcolor: 'action.selected',
                                            cursor: 'pointer'
                                        }
                                    }}
                                    onClick={() => openEmailDialog(email)}
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
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    {email.snippet}
                                                </Typography>
                                                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleReadStatus(email.id);
                                                        }}
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

    // Render email dialog
    const renderEmailDialog = () => {
        if (!selectedEmail) return null;

        return (
            <Dialog
                open={dialogOpen}
                onClose={closeEmailDialog}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        overflow: 'hidden'
                    }
                }}
            >
                <DialogTitle sx={{
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 2
                }}>
                    <Typography variant="h6" sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '90%',
                        fontWeight: 'medium'
                    }}>
                        {selectedEmail.subject}
                    </Typography>
                    <IconButton size="small" onClick={closeEmailDialog} aria-label="close">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: 3 }}>
                    <Box sx={{
                        mb: 3,
                        pb: 2,
                        borderBottom: '1px solid',
                        borderColor: 'divider'
                    }}>
                        <Typography variant="subtitle1" fontWeight="medium">
                            {selectedEmail.from}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            To: {emailAddress || 'you@example.com'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {formatDate(selectedEmail.date)}
                        </Typography>
                    </Box>
                    {selectedEmail.body ? (
                        <div
                            dangerouslySetInnerHTML={{ __html: selectedEmail.body }}
                            style={{
                                lineHeight: 1.6,
                                overflow: 'auto'
                            }}
                        />
                    ) : (
                        <Typography variant="body1" sx={{
                            whiteSpace: 'pre-line',
                            lineHeight: 1.6
                        }}>
                            {selectedEmail.snippet}
                            {/* Fallback to snippet if no body is available */}
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions sx={{
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    p: 2,
                    justifyContent: 'space-between'
                }}>
                    <Button
                        startIcon={<MarkEmailUnreadIcon />}
                        onClick={() => {
                            toggleReadStatus(selectedEmail.id);
                            closeEmailDialog();
                        }}
                        color="primary"
                        variant="outlined"
                    >
                        Mark as unread
                    </Button>
                    <Box>
                        <Button
                            onClick={closeEmailDialog}
                            sx={{ mr: 1 }}
                        >
                            Close
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<ReplyIcon />}
                            onClick={closeEmailDialog}
                        >
                            Reply
                        </Button>
                    </Box>
                </DialogActions>
            </Dialog>
        );
    };

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
            {renderEmailDialog()}
        </Box>
    );
};

export default EmailWidget; 