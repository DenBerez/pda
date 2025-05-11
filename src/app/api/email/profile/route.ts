import { NextRequest, NextResponse } from "next/server";
import { google } from 'googleapis';
import { setupGmailAuth } from '../helpers';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const refreshToken = searchParams.get('refreshToken');

        if (!refreshToken) {
            return NextResponse.json({ error: 'Refresh token is required' }, { status: 400 });
        }

        // For demo purposes, return mock data in development
        if (process.env.NODE_ENV === 'development') {
            return NextResponse.json({
                email: 'demo.user@gmail.com',
                name: 'Demo User'
            });
        }

        // Use the Gmail API to fetch user profile
        const auth = await setupGmailAuth(refreshToken);
        const gmail = google.gmail({ version: 'v1', auth });

        const profile = await gmail.users.getProfile({
            userId: 'me'
        });

        return NextResponse.json({
            email: profile.data.emailAddress,
            name: profile.data.emailAddress?.split('@')[0] || 'User'
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: `Failed to fetch user profile: ${errorMessage}` }, { status: 500 });
    }
} 