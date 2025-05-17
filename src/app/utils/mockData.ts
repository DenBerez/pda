export const getSpotifyMockData = (action: 'current' | 'recent') => {
    if (action === 'current') {
        return {
            isPlaying: true,
            currentTrack: {
                // ... mock current track data
            }
        };
    }
    return {
        recentTracks: Array(5).fill(null).map((_, i) => ({
            // ... mock recent tracks data
        }))
    };
};
