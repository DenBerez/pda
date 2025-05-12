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

        const fetchAudioData = async (retryCount = 0) => {
            try {
                console.log('Fetching audio data for track:', trackId);
                const response = await fetch('/api/spotify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'audio-data',
                        trackId,
                        refreshToken
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('Error response:', errorData);

                    // If we get a 401, the token might be expired
                    if (response.status === 401 && retryCount < 2) {
                        console.log('Retrying after authorization error...');
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        return fetchAudioData(retryCount + 1);
                    }

                    throw new Error(errorData.error || `Failed to fetch audio data: ${response.status}`);
                }

                const data = await response.json();
                console.log('Received audio data:', data);

                audioFeaturesRef.current = {
                    features: data.features,
                    analysis: data.analysis
                };

                if (isPlaying) {
                    startVisualization();
                }
            } catch (error) {
                console.error('Error fetching audio data:', error);
                // Set fallback data for visualization
                audioFeaturesRef.current = {
                    features: {
                        energy: 0.5,
                        tempo: 120,
                        danceability: 0.5,
                        valence: 0.5
                    },
                    analysis: {
                        segments: [{ pitches: Array(12).fill(0.5) }],
                        beats: [{ start: 0 }],
                        tatums: [{ start: 0 }]
                    }
                };
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

        const container = canvas.parentElement;
        if (!container) return;

        canvas.width = container.clientWidth;
        canvas.height = 100;

        const features = audioFeaturesRef.current.features;
        const analysis = audioFeaturesRef.current.analysis;

        if (!features || !analysis) return;

        const energy = features.energy || 0.5;
        const tempo = features.tempo || 120;
        const danceability = features.danceability || 0.5;
        const valence = features.valence || 0.5;
        const segments = analysis.segments || [];
        const beats = analysis.beats || [];
        const tatums = analysis.tatums || [];

        let lastBeatTime = 0;
        let currentBeatIndex = 0;

        const draw = () => {
            animationRef.current = requestAnimationFrame(draw);
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Calculate current time position
            const currentTime = (Date.now() % (tempo * 20)) / 1000;

            // Find current beat
            const beatDuration = 60 / tempo;
            if (currentTime - lastBeatTime >= beatDuration) {
                lastBeatTime = currentTime;
                currentBeatIndex = (currentBeatIndex + 1) % beats.length;
            }

            // Get current segment based on time
            const segmentIndex = Math.floor(currentTime * (segments.length / (tempo / 60)));
            const currentSegment = segments[segmentIndex % segments.length];

            const barCount = 32;
            const barWidth = canvas.width / barCount;
            const baseHeight = canvas.height * 0.3;

            // Draw background glow
            const gradient = ctx.createRadialGradient(
                canvas.width / 2, canvas.height / 2, 0,
                canvas.width / 2, canvas.height / 2, canvas.width / 2
            );
            gradient.addColorStop(0, `hsla(${valence * 360}, 80%, 50%, 0.2)`);
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw bars
            for (let i = 0; i < barCount; i++) {
                const segmentPitches = currentSegment?.pitches || Array(12).fill(0.5);
                const pitchIndex = i % 12;
                const pitch = segmentPitches[pitchIndex];

                // Calculate height with beat influence
                const beatInfluence = Math.sin(currentTime * Math.PI * 2 * (tempo / 60));
                const heightMultiplier = 1 + (beatInfluence * energy * 0.5);
                const barHeight = (baseHeight + (canvas.height * pitch * energy)) * heightMultiplier;

                // Dynamic color based on audio features
                const hue = (valence * 360) + (i * (360 / barCount));
                const saturation = 70 + (danceability * 30);
                const lightness = 40 + (energy * 30);
                ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.8)`;

                // Draw bar with rounded corners
                const x = i * barWidth;
                const y = canvas.height - barHeight;
                const width = barWidth * 0.8;
                const radius = width / 4;

                ctx.beginPath();
                ctx.moveTo(x + radius, y);
                ctx.lineTo(x + width - radius, y);
                ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
                ctx.lineTo(x + width, y + barHeight - radius);
                ctx.quadraticCurveTo(x + width, y + barHeight, x + width - radius, y + barHeight);
                ctx.lineTo(x + radius, y + barHeight);
                ctx.quadraticCurveTo(x, y + barHeight, x, y + barHeight - radius);
                ctx.lineTo(x, y + radius);
                ctx.quadraticCurveTo(x, y, x + radius, y);
                ctx.closePath();
                ctx.fill();
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
                marginBottom: '8px',
                borderRadius: '8px'
            }}
        />
    );
}