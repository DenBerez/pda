// Add this component to your DashboardGrid.tsx file or create a new file
import { useState, useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface AudioVisualizerProps {
    enabled: boolean;
}

export default function DashboardAudioVisualizer({ enabled }: AudioVisualizerProps) {
    const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const visualizerRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
    const animationRef = useRef<number | null>(null);

    // Connect to Spotify audio elements
    useEffect(() => {
        if (!enabled) return;

        const findAndConnectSpotifyAudio = () => {
            const audioElements = document.querySelectorAll('audio[data-spotify-player="true"]');
            console.log('Found audio elements:', audioElements.length);
            if (audioElements.length > 0) {
                setAudioElement(audioElements[0] as HTMLAudioElement);
                setIsPlaying(true);
            }
        };

        // Listen for Spotify player ready event
        const handleSpotifyPlayerReady = (event: CustomEvent) => {
            if (event.detail?.audioElement) {
                setAudioElement(event.detail.audioElement);
                setIsPlaying(true);
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
    }, [enabled]);

    // Initialize WaveSurfer when audio element is available
    useEffect(() => {
        if (!enabled || !audioElement || !visualizerRef.current) return;

        // Create audio context and analyzer
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }

        if (!analyserRef.current) {
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;
        }

        // Connect audio element to analyzer
        if (!sourceNodeRef.current && audioElement) {
            sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audioElement);
            sourceNodeRef.current.connect(analyserRef.current);
            analyserRef.current.connect(audioContextRef.current.destination);
        }

        // Initialize WaveSurfer
        if (!wavesurferRef.current) {
            wavesurferRef.current = WaveSurfer.create({
                container: visualizerRef.current,
                waveColor: 'rgba(255, 0, 255, 0.5)',
                progressColor: 'rgba(255, 0, 255, 0.8)',
                cursorWidth: 0,
                barWidth: 2,
                barGap: 2,
                height: 100,
                interact: false,
                normalize: true
            });
        }

        // Start visualization
        const visualize = () => {
            if (!analyserRef.current || !visualizerRef.current) return;

            const bufferLength = analyserRef.current.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            analyserRef.current.getByteFrequencyData(dataArray);

            // Update WaveSurfer with frequency data
            if (wavesurferRef.current) {
                const waveformData = Array.from(dataArray).map(value => value / 128 - 1);
                const blob = new Blob([new Float32Array(waveformData)], { type: 'audio/wav' });
                wavesurferRef.current.loadBlob(blob);
            }

            animationRef.current = requestAnimationFrame(visualize);
        };

        visualize();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }

            if (wavesurferRef.current) {
                wavesurferRef.current.destroy();
                wavesurferRef.current = null;
            }

            if (sourceNodeRef.current) {
                sourceNodeRef.current.disconnect();
                sourceNodeRef.current = null;
            }
        };
    }, [enabled, audioElement]);

    if (!enabled || !audioElement) return null;

    return (
        <div
            ref={visualizerRef}
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
        />
    );
}