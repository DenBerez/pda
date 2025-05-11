// Add this component to your DashboardGrid.tsx file or create a new file
import { useState, useEffect, useRef } from 'react';

interface AudioVisualizerProps {
    enabled: boolean;
}

export default function DashboardAudioVisualizer({ enabled }: AudioVisualizerProps) {
    const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
    const [analyzer, setAnalyzer] = useState<AnalyserNode | null>(null);
    const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    // Initialize audio context and analyzer
    useEffect(() => {
        if (!enabled) return;

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const context = new AudioContext();
        const analyzerNode = context.createAnalyser();

        analyzerNode.fftSize = 256;

        setAudioContext(context);
        setAnalyzer(analyzerNode);

        return () => {
            if (context.state !== 'closed') {
                context.close();
            }
        };
    }, [enabled]);

    // Connect to Spotify audio elements
    useEffect(() => {
        if (!enabled || !audioContext || !analyzer) return;

        const connectAudioElement = (audioElement: HTMLAudioElement) => {
            try {
                const source = audioContext.createMediaElementSource(audioElement);
                source.connect(analyzer);
                analyzer.connect(audioContext.destination);
                setAudioElement(audioElement);
                setIsPlaying(true);
            } catch (error) {
                console.error('Error connecting to audio element:', error);
            }
        };

        // Find Spotify audio elements
        const findAndConnectSpotifyAudio = () => {
            const audioElements = document.querySelectorAll('audio[data-spotify-player="true"]');
            if (audioElements.length > 0) {
                connectAudioElement(audioElements[0] as HTMLAudioElement);
            }
        };

        // Listen for Spotify player ready event
        const handleSpotifyPlayerReady = (event: CustomEvent) => {
            if (event.detail?.audioElement) {
                connectAudioElement(event.detail.audioElement);
            }
        };

        window.addEventListener('spotify-player-ready', handleSpotifyPlayerReady as EventListener);

        // Initial check for existing audio elements
        findAndConnectSpotifyAudio();

        // Periodically check for new audio elements
        const intervalId = setInterval(findAndConnectSpotifyAudio, 2000);

        return () => {
            window.removeEventListener('spotify-player-ready', handleSpotifyPlayerReady as EventListener);
            clearInterval(intervalId);
            setIsPlaying(false);
            setAudioElement(null);
        };
    }, [enabled, audioContext, analyzer]);

    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!enabled || !audioElement || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        let animationFrameId: number;

        const draw = () => {
            if (!enabled || !audioElement) return;

            const analyzerNode = analyzer;
            if (!analyzerNode) return;

            const bufferLength = analyzerNode.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            analyzerNode.getByteFrequencyData(dataArray);

            context.clearRect(0, 0, canvas.width, canvas.height);

            const barWidth = canvas.width / bufferLength;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i] / 255 * canvas.height;
                context.fillStyle = 'rgba(255, 0, 255, 0.5)';
                context.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                x += barWidth + 2;
            }

            animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [enabled, audioElement, analyzer]);

    if (!enabled || !audioElement) return null;

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
                opacity: 0.7
            }}
            width={window.innerWidth}
            height={100}
        />
    );
}