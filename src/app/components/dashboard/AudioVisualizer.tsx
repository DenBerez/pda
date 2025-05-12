// Add this component to your DashboardGrid.tsx file or create a new file
import { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
    trackId: string | null;
    isPlaying: boolean;
    refreshToken: string | null;
}

export default function AudioVisualizer({ trackId, isPlaying, refreshToken }: AudioVisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationRef = useRef<number | null>(null);
    const audioFeaturesRef = useRef<any>(null);

    useEffect(() => {
        if (!trackId || !refreshToken) return;

        const fetchAudioData = async () => {
            try {
                const response = await fetch('/api/spotify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'audio-data',
                        trackId,
                        refreshToken
                    })
                });

                if (!response.ok) throw new Error('Failed to fetch audio data');
                const data = await response.json();
                audioFeaturesRef.current = data;

                if (isPlaying) {
                    startVisualization();
                }
            } catch (error) {
                console.error('Error fetching audio data:', error);
            }
        };

        fetchAudioData();
    }, [trackId, refreshToken]);

    useEffect(() => {
        if (isPlaying && audioFeaturesRef.current) {
            startVisualization();
        } else {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null;
            }
        }
    }, [isPlaying]);

    const startVisualization = () => {
        if (!canvasRef.current || !audioFeaturesRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Get parent container dimensions
        const container = canvas.parentElement;
        if (!container) return;

        canvas.width = container.clientWidth;
        canvas.height = 100;

        const features = audioFeaturesRef.current.features;
        const analysis = audioFeaturesRef.current.analysis;

        if (!features || !analysis) return;

        // Use actual audio features for visualization
        const energy = features.energy || 0.5;
        const tempo = features.tempo || 120;
        const danceability = features.danceability || 0.5;
        const valence = features.valence || 0.5;
        const segments = analysis.segments || [];

        const draw = () => {
            animationRef.current = requestAnimationFrame(draw);
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Use actual segment data for visualization
            const currentTime = (Date.now() % (tempo * 20)) / 1000;
            const segmentIndex = Math.floor(currentTime * (segments.length / (tempo / 60)));
            const currentSegment = segments[segmentIndex % segments.length];

            const barCount = 64;
            const barWidth = canvas.width / barCount;

            for (let i = 0; i < barCount; i++) {
                const segmentPitches = currentSegment?.pitches || Array(12).fill(0.5);
                const pitchIndex = i % 12;
                const pitch = segmentPitches[pitchIndex];

                const barHeight = canvas.height * pitch * energy;

                // Color based on valence and energy
                const hue = valence * 360;
                const saturation = danceability * 100;
                const lightness = 50 + (energy * 20);

                ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.7)`;
                ctx.fillRect(
                    i * barWidth,
                    canvas.height - barHeight,
                    barWidth * 0.9,
                    barHeight
                );
            }
        };

        draw();
    };

    return (
        <canvas
            ref={canvasRef}
            style={{
                width: '100%',
                height: '100px',
                display: 'block',
                marginTop: '8px',
                marginBottom: '8px'
            }}
        />
    );
}