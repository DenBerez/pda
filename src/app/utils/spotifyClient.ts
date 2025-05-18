import { refreshSpotifyToken } from "./spotify";

interface SpotifyTrack {
    id: string;
    name: string;
    artists: Array<{ name: string }>;
    album: {
        name: string;
        images: Array<{ url: string }>;
    };
    duration_ms: number;
    uri: string;
}

interface PlayerState {
    is_playing: boolean;
    item: SpotifyTrack;
    progress_ms: number;
}

export class SpotifyClient {
    private baseUrl = 'https://api.spotify.com/v1';

    constructor(
        private refreshToken: string,
        private clientId?: string,
        private clientSecret?: string
    ) { }

    private async getValidToken() {
        console.log('Refreshing Spotify token...');
        const response = await fetch('/api/spotify/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                refreshToken: this.refreshToken,
                clientId: this.clientId,
                clientSecret: this.clientSecret
            })
        });

        if (!response.ok) {
            console.error('Failed to refresh token:', response.statusText);
            throw new Error('Failed to refresh token');
        }
        const data = await response.json();
        console.log('Token refreshed successfully');
        return data.access_token;
    }

    private async fetchSpotify(endpoint: string, options: RequestInit = {}) {
        console.log(`Fetching Spotify API: ${endpoint}`);
        const token = await this.getValidToken();
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 204) {
            console.log('Spotify API returned 204 No Content');
            return null;
        }
        if (!response.ok) {
            console.error(`Spotify API error (${response.status}): ${response.statusText}`);
            throw new Error(`Spotify API error: ${response.statusText}`);
        }
        console.log(`Spotify API call successful: ${endpoint}`);
        return response.json();
    }

    async getCurrentTrack(): Promise<PlayerState | null> {
        console.log('Getting current track...');
        const result = await this.fetchSpotify('/me/player');
        console.log('Current track result:', result ? 'Data received' : 'No active track');
        return result;
    }

    async getRecentTracks(limit = 5) {
        console.log(`Getting recent tracks (limit: ${limit})...`);
        const data = await this.fetchSpotify(`/me/player/recently-played?limit=${limit}`);
        console.log(`Retrieved ${data?.items?.length || 0} recent tracks`);
        return data?.items || [];
    }

    async controlPlayback(action: string, options?: any) {
        console.log(`Controlling playback: ${action}`, options ? 'with options' : '');
        const endpoints: Record<string, { path: string; method: string }> = {
            play: { path: '/me/player/play', method: 'PUT' },
            pause: { path: '/me/player/pause', method: 'PUT' },
            next: { path: '/me/player/next', method: 'POST' },
            previous: { path: '/me/player/previous', method: 'POST' },
            shuffle: { path: '/me/player/shuffle', method: 'PUT' },
            repeat: { path: '/me/player/repeat', method: 'PUT' }
        };

        const endpoint = endpoints[action];
        if (!endpoint) {
            console.error(`Invalid playback action: ${action}`);
            throw new Error('Invalid action');
        }

        const result = await this.fetchSpotify(endpoint.path, {
            method: endpoint.method,
            body: options ? JSON.stringify(options) : undefined
        });
        console.log(`Playback control (${action}) completed`);
        return result;
    }
}
