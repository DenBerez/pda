// In src/app/api/email/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { google } from 'googleapis';
import { setupGmailAuth } from '../helpers';

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
            const auth = await setupGmailAuth(refreshToken);
            const gmail = google.gmail({ version: 'v1', auth });

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
        return NextResponse.json({ error: 'Failed to update email status' }, { status: 500 });
    }
}