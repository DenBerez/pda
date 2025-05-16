import { NextRequest, NextResponse } from "next/server";
import { google, calendar_v3 } from 'googleapis';

// Google Calendar OAuth2 setup
const setupCalendarAuth = async (refreshToken: string) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
        throw new Error('Google API credentials not properly configured');
    }

    const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
    );

    oauth2Client.setCredentials({
        refresh_token: refreshToken
    });

    return oauth2Client;
};

// Fetch events from Google Calendar
const fetchGoogleCalendarEvents = async (refreshToken: string, maxResults = 10, timeMin?: string) => {
    try {
        const auth = await setupCalendarAuth(refreshToken);
        const calendar = google.calendar({ version: 'v3', auth });

        // If no timeMin is provided, use the current datetime
        if (!timeMin) {
            timeMin = new Date().toISOString();
        }

        const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin: timeMin,
            maxResults: maxResults,
            singleEvents: true,
            orderBy: 'startTime',
        });

        return response.data.items || [];
    } catch (error) {
        console.error('Error fetching Google Calendar events:', error);
        if (error instanceof Error &&
            (error.message.includes('invalid_grant') ||
                error.message.includes('token') ||
                error.message.includes('auth'))) {
            throw new Error('Authentication failed. Please reconnect your Google Calendar.');
        }
        throw error;
    }
};

// Generate mock calendar events for development
const generateMockEvents = (maxResults = 10) => {
    const events = [];
    const today = new Date();

    for (let i = 0; i < maxResults; i++) {
        const startDate = new Date(today);
        startDate.setDate(today.getDate() + Math.floor(i / 2));
        startDate.setHours(9 + (i % 3) * 2, 0, 0);

        const endDate = new Date(startDate);
        endDate.setHours(startDate.getHours() + 1);

        events.push({
            id: `event-${i}`,
            summary: `Mock Event ${i + 1}`,
            description: `This is a mock calendar event ${i + 1}`,
            start: {
                dateTime: startDate.toISOString(),
                timeZone: 'UTC'
            },
            end: {
                dateTime: endDate.toISOString(),
                timeZone: 'UTC'
            },
            location: i % 3 === 0 ? 'Virtual Meeting' : 'Office Room ' + (i + 1),
            creator: {
                email: 'user@example.com',
                displayName: 'Demo User'
            }
        });
    }

    return events;
};

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const refreshToken = searchParams.get('refreshToken');
        const maxResults = parseInt(searchParams.get('maxResults') || '10', 10);
        const timeMin = searchParams.get('timeMin') || undefined;
        const month = searchParams.get('month');
        const year = searchParams.get('year');

        let events = [];

        // If month and year are provided, calculate the timeMin for that month
        let calculatedTimeMin = timeMin;
        if (month && year) {
            const startOfMonth = new Date(parseInt(year), parseInt(month), 1);
            calculatedTimeMin = startOfMonth.toISOString();
        }

        // For development or when no token is provided, return mock data
        if (process.env.NODE_ENV === 'development' || !refreshToken) {
            events = generateMockEvents(maxResults);
        } else {
            // Use actual Google Calendar API with the provided refresh token
            events = await fetchGoogleCalendarEvents(refreshToken, maxResults, calculatedTimeMin);
        }

        return NextResponse.json({ events });
    } catch (error) {
        console.error('Error in calendar API:', error);
        return NextResponse.json({ error: 'Failed to fetch calendar events' }, { status: 500 });
    }
} 