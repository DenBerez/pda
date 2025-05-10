import { NextRequest, NextResponse } from "next/server";
import { google } from 'googleapis';
import { setupGmailAuth } from '../helpers';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const provider = searchParams.get('provider');
        const emailId = searchParams.get('emailId');
        const refreshToken = searchParams.get('refreshToken');
        const email = searchParams.get('email');
        const password = searchParams.get('password');

        if (!provider || !emailId) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        let body = '';

        // For demo purposes or development environment, return mock data
        if (process.env.NODE_ENV === 'development' || !refreshToken) {
            body = `<div>
                <p>This is a mock email body for email ID: ${emailId}</p>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, 
                nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget ultricies nisl 
                nisl eget nisl. Nullam auctor, nisl eget ultricies tincidunt, nisl nisl 
                aliquam nisl, eget ultricies nisl nisl eget nisl.</p>
                <p>Best regards,<br>Sender</p>
            </div>`;
        } else if (provider === 'gmail' && refreshToken) {
            // Use the Gmail API to fetch email content
            const auth = await setupGmailAuth(refreshToken);
            const gmail = google.gmail({ version: 'v1', auth });

            const message = await gmail.users.messages.get({
                userId: 'me',
                id: emailId,
                format: 'full'
            });

            // Extract the email body - this is simplified
            // In a real implementation, you'd need to handle different MIME types
            // and potentially decode base64 content
            const payload = message.data.payload;
            if (payload?.parts && payload.parts.length > 0) {
                // Find HTML part if available
                const htmlPart = payload.parts.find(part =>
                    part.mimeType === 'text/html' && part.body?.data
                );

                if (htmlPart && htmlPart.body?.data) {
                    // Decode base64 content
                    body = Buffer.from(htmlPart.body.data, 'base64').toString('utf-8');
                } else {
                    // Fall back to plain text
                    const textPart = payload.parts.find(part =>
                        part.mimeType === 'text/plain' && part.body?.data
                    );

                    if (textPart && textPart.body?.data) {
                        const plainText = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
                        body = `<pre>${plainText}</pre>`;
                    }
                }
            } else if (payload?.body?.data) {
                // Single part message
                body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
            }
        } else if (provider === 'aol') {
            // For AOL, we would implement IMAP-based content fetching
            // For now, just return mock data
            body = `<div>
                <p>This is a mock AOL email body for email ID: ${emailId}</p>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                <p>Best regards,<br>AOL Sender</p>
            </div>`;
        } else {
            return NextResponse.json({ error: 'Invalid credentials for the selected provider' }, { status: 400 });
        }

        return NextResponse.json({ body });
    } catch (error) {
        console.error('Email content fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch email content' }, { status: 500 });
    }
}