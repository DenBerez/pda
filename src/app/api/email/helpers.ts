import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export async function setupGmailAuth(refreshToken: string): Promise<OAuth2Client> {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET,
        process.env.GMAIL_REDIRECT_URI
    );

    oauth2Client.setCredentials({
        refresh_token: refreshToken
    });

    return oauth2Client;
} 