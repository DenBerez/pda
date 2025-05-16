'use client';

import { Box, Container, Typography } from '@mui/material';

export default function PrivacyPolicy() {
    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box sx={{
                backgroundColor: 'background.paper',
                borderRadius: 2,
                p: 4,
                mb: 4
            }}>
                {/* Privacy Policy Content */}
                <div dangerouslySetInnerHTML={{
                    __html: `
          <!-- Insert the entire privacy policy HTML content here -->
        `}} />
            </Box>
        </Container>
    );
} 