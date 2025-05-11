// In src/app/api/email/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { google } from 'googleapis';

export async function POST(request: NextRequest) {
    try {
        // Parse the request body instead of using query parameters
        const body = await request.json();
        const { provider, emailId, markAs, refreshToken, email, password } = body;

        if (!provider || !emailId || !markAs) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        // For demo purposes or development environment, return success without making actual API calls
        if (process.env.NODE_ENV === 'development') {
            return NextResponse.json({ success: true, message: 'Email status updated (mock)' });
        }

        if (provider === 'gmail' && refreshToken) {
            // Use the Gmail API to update email status
            // Create OAuth2 client directly instead of using the helper
            const oauth2Client = new google.auth.OAuth2(
                process.env.GMAIL_CLIENT_ID,
                process.env.GMAIL_CLIENT_SECRET
                // No redirect URI needed for token usage
            );

            oauth2Client.setCredentials({
                refresh_token: refreshToken
            });

            const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

            // Determine which labels to add/remove based on markAs parameter
            const addLabelIds = markAs === 'unread' ? ['UNREAD'] : [];
            const removeLabelIds = markAs === 'read' ? ['UNREAD'] : [];

            await gmail.users.messages.modify({
                userId: 'me',
                id: emailId,
                requestBody: {
                    addLabelIds: addLabelIds,
                    removeLabelIds: removeLabelIds
                }
            });

            return NextResponse.json({ success: true, message: 'Email status updated' });
        } else if (provider === 'aol' && email && password) {
            // For AOL, we would implement IMAP-based status updates
            // For now, just return a mock success response
            return NextResponse.json({ success: true, message: 'Email status updated (mock)' });
        } else {
            return NextResponse.json({ error: 'Invalid credentials for the selected provider' }, { status: 400 });
        }
    } catch (error) {
        console.error('Email status update error:', error);
        // Add more detailed error information
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: `Failed to update email status: ${errorMessage}` }, { status: 500 });
    }
}