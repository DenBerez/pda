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

        const bufferLength = analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const render = () => {
            animationRef.current = requestAnimationFrame(render);

            analyserNode.getByteFrequencyData(dataArray);

            ctx.fillStyle = 'rgb(0, 0, 0)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i] / 2;

                ctx.fillStyle = `rgb(${barHeight + 100},50,50)`;
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