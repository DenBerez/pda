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
        const response = await fetch('/api/spotify/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                refreshToken: this.refreshToken,
                clientId: this.clientId,
                clientSecret: this.clientSecret
            })
        });

        if (!response.ok) throw new Error('Failed to refresh token');
        const data = await response.json();
        return data.access_token;
    }

    private async fetchSpotify(endpoint: string, options: RequestInit = {}) {
        const token = await this.getValidToken();
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 204) return null;
        if (!response.ok) throw new Error(`Spotify API error: ${response.statusText}`);
        return response.json();
    }

    async getCurrentTrack(): Promise<PlayerState | null> {
        return this.fetchSpotify('/me/player');
    }

    async getRecentTracks(limit = 5) {
        const data = await this.fetchSpotify(`/me/player/recently-played?limit=${limit}`);
        return data?.items || [];
    }

    async controlPlayback(action: string, options?: any) {
        const endpoints: Record<string, { path: string; method: string }> = {
            play: { path: '/me/player/play', method: 'PUT' },
            pause: { path: '/me/player/pause', method: 'PUT' },
            next: { path: '/me/player/next', method: 'POST' },
            previous: { path: '/me/player/previous', method: 'POST' },
            shuffle: { path: '/me/player/shuffle', method: 'PUT' }
        };

        const endpoint = endpoints[action];
        if (!endpoint) throw new Error('Invalid action');

        return this.fetchSpotify(endpoint.path, {
            method: endpoint.method,
            body: options ? JSON.stringify(options) : undefined
        });
    }
}
