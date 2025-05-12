// Add this component to your DashboardGrid.tsx file or create a new file
import { useState, useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';

declare global {
    interface HTMLAudioElement {
        mozCaptureStream?: () => MediaStream;
        captureStream?: () => MediaStream;
    }
}

interface AudioVisualizerProps {
    enabled: boolean;
}

interface SpotifyPlaybackEvent extends CustomEvent {
    detail: {
        currentTrack?: { id: string };
        spotifyPlaying: boolean;
    }
}

// Add near the top of the file, before the component
async function fetchAudioFeatures(trackId: string, refreshToken?: string) {
    try {
        const response = await fetch(`/api/spotify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'audio-data',
                trackId: trackId,
                refreshToken: refreshToken
            })
        });

        if (!response.ok) throw new Error('Failed to fetch audio data');
        const data = await response.json();

        // Log the response to help with debugging
        console.log('Audio features response:', data);

        return data;
    } catch (error) {
        console.error('Error fetching audio data:', error);
        throw error;
    }
}

export default function DashboardAudioVisualizer({ enabled }: AudioVisualizerProps) {
    const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationRef = useRef<number | null>(null);

    // Check for browser support
    useEffect(() => {
        if (enabled) {
            console.log('AudioVisualizer enabled, looking for audio sources...');
        }
    }, [enabled]);

    // Connect to Spotify audio elements
    useEffect(() => {
        if (!enabled) return;

        // Listen for the custom event from SpotifyWidget
        const handleSpotifyAudio = (event: CustomEvent) => {
            if (event.detail?.audioElement) {
                console.log('Received audio element from SpotifyWidget:', event.detail.audioElement);
                setAudioElement(event.detail.audioElement);
                setIsPlaying(true);
            }
        };

        // Find existing audio elements with the data attribute
        const findExistingAudioElements = () => {
            const spotifyAudio = document.querySelector('audio[data-spotify-player="true"]');
            if (spotifyAudio) {
                console.log('Found existing Spotify audio element');
                const audioEl = spotifyAudio as HTMLAudioElement;
                setAudioElement(audioEl);
                setIsPlaying(!audioEl.paused);
            }
        };

        window.addEventListener('spotify-audio-element', handleSpotifyAudio as EventListener);

        // Initial check
        findExistingAudioElements();

        // Periodic check as fallback
        const intervalId = setInterval(findExistingAudioElements, 2000);

        return () => {
            window.removeEventListener('spotify-audio-element', handleSpotifyAudio as EventListener);
            clearInterval(intervalId);
        };
    }, [enabled]);

    // Integrate with Spotify events and audio features
    useEffect(() => {
        if (!enabled) return;

        let audioFeatures: any = null;

        const handleSpotifyPlaybackChange = async (event: SpotifyPlaybackEvent) => {
            console.log('Received Spotify playback state change:', event.detail);

            if (event.detail.currentTrack?.id && event.detail.spotifyPlaying) {
                // Get audio features for the current track
                try {
                    const trackId = event.detail.currentTrack.id;
                    audioFeatures = await fetchAudioFeatures(trackId);
                    console.log('Got audio features:', audioFeatures);

                    // Force the canvas to be visible and start enhanced visualization
                    if (canvasRef.current) {
                        canvasRef.current.style.display = 'block';
                        startEnhancedVisualization(audioFeatures);
                    }
                } catch (error) {
                    console.error('Failed to fetch audio features:', error);
                    // Fallback to basic visualization
                    if (canvasRef.current) {
                        canvasRef.current.style.display = 'block';
                        startBasicVisualization();
                    }
                }
            } else if (!event.detail.spotifyPlaying) {
                // Stop visualization when playback stops
                if (animationRef.current) {
                    cancelAnimationFrame(animationRef.current);
                    animationRef.current = null;
                }

                // Hide canvas
                if (canvasRef.current) {
                    canvasRef.current.style.display = 'none';
                }
            }
        };

        window.addEventListener('spotify-playback-state-changed',
            handleSpotifyPlaybackChange as unknown as EventListener);

        return () => {
            window.removeEventListener('spotify-playback-state-changed',
                handleSpotifyPlaybackChange as unknown as EventListener);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [enabled]);

    // Basic visualization when no audio features are available
    const startBasicVisualization = () => {
        if (!canvasRef.current) return;

        // Show canvas
        canvasRef.current.style.display = 'block';

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas dimensions
        canvas.width = window.innerWidth;
        canvas.height = 100;

        // Create fake data that looks like an audio visualization
        const fakeDataLength = 128;
        const fakeData = new Uint8Array(fakeDataLength);

        const draw = () => {
            animationRef.current = requestAnimationFrame(draw);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Generate some fake data that looks like audio
            for (let i = 0; i < fakeDataLength; i++) {
                // Create a wave-like pattern
                fakeData[i] = 50 + Math.sin(Date.now() * 0.001 + i * 0.15) * 30 + Math.random() * 15;
            }

            // Draw visualization
            const barWidth = (canvas.width / fakeDataLength) * 2.5;
            let x = 0;

            for (let i = 0; i < fakeDataLength; i++) {
                const barHeight = fakeData[i] / 2;

                // Use theme colors
                ctx.fillStyle = `rgba(100, 100, 255, ${barHeight / 100})`;
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

                x += barWidth + 1;
            }
        };

        draw();
    };

    // Enhanced visualization that responds to track features
    const startEnhancedVisualization = (audioFeatures: any) => {
        if (!canvasRef.current) return;

        // Show canvas
        canvasRef.current.style.display = 'block';

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas dimensions
        canvas.width = window.innerWidth;
        canvas.height = 100;

        // Use audio features to influence visualization
        const energy = audioFeatures?.features?.energy || 0.5;
        const tempo = audioFeatures?.features?.tempo || 120;
        const danceability = audioFeatures?.features?.danceability || 0.5;
        const valence = audioFeatures?.features?.valence || 0.5; // Happiness/positivity

        // Calculate wave parameters based on track features
        const amplitude = 30 * energy;
        const frequency = 0.15 * (danceability + 0.5);
        const speed = tempo / 120 * 0.001;

        // Choose colors based on valence (happiness)
        const baseColor = valence > 0.5
            ? [100, 100, 255] // Blue for positive songs
            : [255, 100, 100]; // Red for negative songs

        const fakeDataLength = 128;
        const fakeData = new Uint8Array(fakeDataLength);

        const draw = () => {
            animationRef.current = requestAnimationFrame(draw);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Generate data that responds to the track features
            for (let i = 0; i < fakeDataLength; i++) {
                // Create a wave-like pattern influenced by track features
                fakeData[i] = 50 + Math.sin(Date.now() * speed + i * frequency) * amplitude + Math.random() * 15 * energy;
            }

            // Draw visualization
            const barWidth = (canvas.width / fakeDataLength) * 2.5;
            let x = 0;

            for (let i = 0; i < fakeDataLength; i++) {
                const barHeight = fakeData[i] / 2;

                // Use colors based on track features
                ctx.fillStyle = `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${barHeight / 100 * (0.5 + energy / 2)})`;
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

                x += barWidth + 1;
            }
        };

        draw();
    };

    if (!enabled) return null;

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                width: '100%',
                height: '100px',
                pointerEvents: 'none',
                zIndex: 1,
                opacity: 0.7,
                display: 'none' // Initially hidden, will be shown by the visualization code
            }}
        />
    );
}