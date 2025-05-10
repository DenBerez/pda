import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    IconButton,
    Tooltip,
    Paper,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip
} from '@mui/material';
import { Widget } from '../types';
import RefreshIcon from '@mui/icons-material/Refresh';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import { quotes, quoteCategories, Quote } from '@/app/data/quotes';

interface QuoteWidgetProps {
    widget: Widget;
    editMode: boolean;
}

const QuoteWidget: React.FC<QuoteWidgetProps> = ({ widget, editMode }) => {
    const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);

    // Get configuration from widget or use defaults
    const selectedCategories = widget.config?.categories || ['all'];
    const refreshInterval = widget.config?.refreshInterval || 3600; // Default: 1 hour
    const showAuthor = widget.config?.showAuthor !== false; // Default: true
    const showCategory = widget.config?.showCategory !== false; // Default: true

    const getRandomQuote = () => {
        let filteredQuotes = quotes;

        // Filter by selected categories if not "all"
        if (!selectedCategories.includes('all')) {
            filteredQuotes = quotes.filter(quote =>
                quote.categories.some(cat => selectedCategories.includes(cat))
            );
        }

        // Get random quote from filtered list
        const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
        setCurrentQuote(filteredQuotes[randomIndex]);
    };

    // Get new quote on mount and when configuration changes
    useEffect(() => {
        getRandomQuote();

        const intervalId = setInterval(getRandomQuote, refreshInterval * 1000);
        return () => clearInterval(intervalId);
    }, [selectedCategories.join(','), refreshInterval]);

    if (!currentQuote) {
        return null;
    }

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                {showCategory && (
                    <Box>
                        {currentQuote.categories.map(category => (
                            <Chip
                                key={category}
                                label={category}
                                size="small"
                                sx={{ mr: 0.5 }}
                            />
                        ))}
                    </Box>
                )}
                <Tooltip title="Get new quote">
                    <IconButton onClick={getRandomQuote} size="small">
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
            </Box>

            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    bgcolor: 'background.default',
                    position: 'relative'
                }}
            >
                <FormatQuoteIcon
                    sx={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        opacity: 0.1,
                        fontSize: '3rem'
                    }}
                />
                <Typography
                    variant="h6"
                    component="blockquote"
                    sx={{
                        mb: 2,
                        fontStyle: 'italic',
                        textAlign: 'center'
                    }}
                >
                    {currentQuote.text}
                </Typography>
                {showAuthor && (
                    <Typography
                        variant="subtitle1"
                        color="text.secondary"
                        sx={{
                            textAlign: 'right',
                            mt: 'auto'
                        }}
                    >
                        — {currentQuote.author}
                    </Typography>
                )}
            </Paper>
        </Box>
    );
};

export default QuoteWidget; 