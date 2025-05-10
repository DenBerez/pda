import { NextRequest, NextResponse } from "next/server";
import { google, gmail_v1 } from 'googleapis';
import nodemailer from 'nodemailer';

// Gmail OAuth2 setup
const setupGmailAuth = async (refreshToken: string) => {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET,
        process.env.GMAIL_REDIRECT_URI
    );

    oauth2Client.setCredentials({
        refresh_token: refreshToken
    });

    return oauth2Client;
};

// Fetch emails from Gmail
const fetchGmailEmails = async (refreshToken: string, maxResults = 10) => {
    try {
        const auth = await setupGmailAuth(refreshToken);
        const gmail = google.gmail({ version: 'v1', auth });

        const response = await gmail.users.messages.list({
            userId: 'me',
            maxResults: maxResults,
            q: 'in:inbox',
        });

        const messages = response.data.messages || [];
        const emails = [];

        for (const message of messages.slice(0, maxResults)) {
            const email = await gmail.users.messages.get({
                userId: 'me',
                id: message.id as string,
                format: 'metadata',
                metadataHeaders: ['From', 'Subject', 'Date'],
            });

            const headers = email.data.payload?.headers || [];
            const subject = headers.find((h: gmail_v1.Schema$MessagePartHeader) => h.name === 'Subject')?.value || 'No Subject';
            const from = headers.find((h: gmail_v1.Schema$MessagePartHeader) => h.name === 'From')?.value || 'Unknown Sender';
            const date = headers.find((h: gmail_v1.Schema$MessagePartHeader) => h.name === 'Date')?.value || '';

            emails.push({
                id: email.data.id,
                subject,
                from,
                date,
                snippet: email.data.snippet,
                unread: email.data.labelIds?.includes('UNREAD') || false,
            });
        }

        return emails;
    } catch (error) {
        console.error('Error fetching Gmail emails:', error);
        throw error;
    }
};

// Fetch emails from AOL
const fetchAOLEmails = async (email: string, password: string, maxResults = 10) => {
    try {
        // Create a transporter for AOL
        const transporter = nodemailer.createTransport({
            service: 'aol',
            auth: {
                user: email,
                pass: password,
            },
        });

        // Use IMAP to fetch emails
        const imapConfig = {
            user: email,
            password: password,
            host: 'imap.aol.com',
            port: 993,
            tls: true,
        };

        // This is a simplified example - in a real implementation, you would use an IMAP library
        // like node-imap or imapflow to fetch emails

        // For demo purposes, return mock data
        return Array(maxResults).fill(null).map((_, i) => ({
            id: `aol-${i}`,
            subject: `AOL Email Subject ${i + 1}`,
            from: `sender${i + 1}@example.com`,
            date: new Date(Date.now() - i * 3600000).toISOString(),
            snippet: `This is a preview of email message ${i + 1}...`,
            unread: i % 3 === 0, // Every third email is unread
        }));
    } catch (error) {
        console.error('Error fetching AOL emails:', error);
        throw error;
    }
};

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const provider = searchParams.get('provider');
        const email = searchParams.get('email');
        const refreshToken = searchParams.get('refreshToken');
        const password = searchParams.get('password');
        const maxResults = parseInt(searchParams.get('maxResults') || '10', 10);

        if (!provider) {
            return NextResponse.json({ error: 'Email provider is required' }, { status: 400 });
        }

        let emails = [];

        // For demo purposes, we'll return mock data instead of requiring actual credentials
        if (provider === 'gmail') {
            if (process.env.NODE_ENV === 'development' || !refreshToken) {
                // Return mock data for development or when no token is provided
                emails = Array(maxResults).fill(null).map((_, i) => ({
                    id: `gmail-${i}`,
                    subject: `Gmail Subject ${i + 1}`,
                    from: `sender${i + 1}@gmail.com`,
                    date: new Date(Date.now() - i * 3600000).toISOString(),
                    snippet: `This is a preview of email message ${i + 1}...`,
                    unread: i % 2 === 0, // Every other email is unread
                }));
            } else {
                // Use actual Gmail API with the provided refresh token
                emails = await fetchGmailEmails(refreshToken, maxResults);
            }
        } else if (provider === 'aol') {
            if (process.env.NODE_ENV === 'development' || !email || !password) {
                // Return mock data for development or when no credentials are provided
                emails = Array(maxResults).fill(null).map((_, i) => ({
                    id: `aol-${i}`,
                    subject: `AOL Email Subject ${i + 1}`,
                    from: `sender${i + 1}@aol.com`,
                    date: new Date(Date.now() - i * 3600000).toISOString(),
                    snippet: `This is a preview of email message ${i + 1}...`,
                    unread: i % 3 === 0, // Every third email is unread
                }));
            } else {
                // Use actual AOL credentials
                emails = await fetchAOLEmails(email, password, maxResults);
            }
        } else {
            return NextResponse.json({ error: 'Unsupported email provider' }, { status: 400 });
        }

        return NextResponse.json({ emails });
    } catch (error) {
        console.error('Email API error:', error);
        return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const provider = searchParams.get('provider');
        const emailId = searchParams.get('emailId');
        const markAs = searchParams.get('markAs');
        const refreshToken = searchParams.get('refreshToken');
        const email = searchParams.get('email');
        const password = searchParams.get('password');

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