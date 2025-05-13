// Add this component to your DashboardGrid.tsx file or create a new file
import { useEffect, useRef, useCallback } from 'react';

interface AudioVisualizerProps {
    trackId: string;
    isPlaying: boolean;
    refreshToken: string;
    analyserNode?: AnalyserNode | null;
}

export default function AudioVisualizer({ trackId, isPlaying, refreshToken, analyserNode }: AudioVisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationRef = useRef<number | null>(null);

    // Visualization function
    const draw = useCallback(() => {
        if (!canvasRef.current || !analyserNode) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size to match display size
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;

        const bufferLength = analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const render = () => {
            animationRef.current = requestAnimationFrame(render);

            analyserNode.getByteFrequencyData(dataArray);

            // Clear with semi-transparent black for trail effect
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / bufferLength) * 2.5;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const percent = dataArray[i] / 255;
                const barHeight = (canvas.height * percent) * 0.8;

                // Create gradient for bars
                const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
                gradient.addColorStop(0, '#1DB954'); // Spotify green
                gradient.addColorStop(1, '#1ed760'); // Lighter green

                ctx.fillStyle = gradient;
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

                x += barWidth + 1;
            }
        };

        render();
    }, [analyserNode]);

    useEffect(() => {
        if (isPlaying) {
            draw();
        } else if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }
    }, [isPlaying, draw]);

    return <canvas ref={canvasRef} style={{ width: '100%', height: '100px' }} />;
}