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

export default function DashboardAudioVisualizer({ enabled }: AudioVisualizerProps) {
    const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const visualizerRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceNodeRef = useRef<MediaElementAudioSourceNode | MediaStreamAudioSourceNode | null>(null);
    const animationRef = useRef<number | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // Connect to Spotify audio elements
    useEffect(() => {
        if (!enabled) return;

        // Primary strategy: Listen for the custom event from SpotifyWidget
        const handleSpotifyAudio = (event: CustomEvent) => {
            if (event.detail?.audioElement) {
                console.log('Received audio element from SpotifyWidget:', event.detail.audioElement);
                setAudioElement(event.detail.audioElement);
                setIsPlaying(true);
            }
        };

        // Secondary strategy: Find existing audio elements with the data attribute
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

    // Initialize WaveSurfer when audio element is available
    useEffect(() => {
        if (!enabled || !audioElement || !visualizerRef.current) return;

        console.log('Setting up audio context for element:', audioElement);

        // Create audio context and analyzer if they don't exist
        if (!audioContextRef.current) {
            try {
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
                console.log('Created audio context:', audioContextRef.current);

                analyserRef.current = audioContextRef.current.createAnalyser();
                analyserRef.current.fftSize = 256;
                console.log('Created analyzer node');
            } catch (err) {
                console.error('Failed to create audio context or analyzer:', err);
                return;
            }
        }

        // Connect audio element to analyzer with progressive fallbacks
        const connectAudio = async () => {
            if (sourceNodeRef.current) {
                sourceNodeRef.current.disconnect();
                sourceNodeRef.current = null;
            }

            // Method 1: Direct connection
            try {
                sourceNodeRef.current = audioContextRef.current!.createMediaElementSource(audioElement);
                sourceNodeRef.current.connect(analyserRef.current!);
                analyserRef.current!.connect(audioContextRef.current!.destination);
                console.log('Connected directly to audio element');
                return true;
            } catch (err) {
                console.warn('Direct connection failed:', err);
            }

            // Method 2: Stream capture
            try {
                const stream = audioElement.mozCaptureStream?.() || audioElement.captureStream?.();
                if (stream) {
                    sourceNodeRef.current = audioContextRef.current!.createMediaStreamSource(stream);
                    sourceNodeRef.current.connect(analyserRef.current!);
                    console.log('Connected via media stream capture');
                    return true;
                }
            } catch (err) {
                console.warn('Stream capture failed:', err);
            }

            // Method 3: System audio capture (requires user permission)
            try {
                console.log('Trying system audio capture');
                const stream = await navigator.mediaDevices.getDisplayMedia({ audio: true, video: false });
                sourceNodeRef.current = audioContextRef.current!.createMediaStreamSource(stream);
                sourceNodeRef.current.connect(analyserRef.current!);
                console.log('Connected using system audio');
                return true;
            } catch (err) {
                console.error('All audio capture methods failed');
                return false;
            }
        };

        connectAudio();

        return () => {
            if (sourceNodeRef.current) {
                sourceNodeRef.current.disconnect();
                sourceNodeRef.current = null;
            }
        };
    }, [enabled, audioElement]);

    // Add this useEffect after your existing ones
    useEffect(() => {
        if (!enabled) return;

        // Try to directly access the audio element from SpotifyWidget
        const connectToSpotifyWidgetAudio = () => {
            // Look for any audio elements that might be playing Spotify content
            const allAudioElements = document.querySelectorAll('audio');
            console.log('All audio elements found:', allAudioElements.length);

            // Add more specific selectors for Spotify
            const spotifyIframe = document.querySelector('iframe[src*="spotify"]');
            if (spotifyIframe) {
                console.log('Found Spotify iframe:', spotifyIframe);
                // Try to mark this for later processing
            }

            // Look for elements with Spotify-related classes
            const spotifyElements = document.querySelectorAll('[class*="spotify"], [id*="spotify"]');
            console.log('Potential Spotify elements:', spotifyElements.length);

            if (allAudioElements.length > 0) {
                // Try to find one that's playing or has a source
                const playingAudio = Array.from(allAudioElements).find(
                    audio => !audio.paused || audio.src.includes('scdn.co') || audio.src.includes('spotify')
                );

                if (playingAudio) {
                    console.log('Found likely Spotify audio:', playingAudio);
                    // Add the data attribute if it's missing
                    playingAudio.dataset.spotifyPlayer = 'true';
                    setAudioElement(playingAudio);
                    setIsPlaying(true);
                }
            }
        };

        // Run immediately and set up interval
        connectToSpotifyWidgetAudio();
        const intervalId = setInterval(connectToSpotifyWidgetAudio, 3000);

        return () => clearInterval(intervalId);
    }, [enabled]);

    // Add fallback canvas visualization
    useEffect(() => {
        if (!enabled || !audioElement || !canvasRef.current || !analyserRef.current) return;

        const canvas = canvasRef.current;
        const canvasCtx = canvas.getContext('2d');
        if (!canvasCtx) return;

        // Set canvas dimensions with device pixel ratio for sharper rendering
        const dpr = window.devicePixelRatio || 1;
        canvas.width = canvas.clientWidth * dpr;
        canvas.height = canvas.clientHeight * dpr;
        canvasCtx.scale(dpr, dpr);

        let animationId: number;

        const renderCanvas = () => {
            if (!analyserRef.current || !canvasCtx) return;

            animationId = requestAnimationFrame(renderCanvas);

            const bufferLength = analyserRef.current.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            analyserRef.current.getByteFrequencyData(dataArray);

            // Clear canvas
            canvasCtx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

            // Create a more dynamic visualization
            const barWidth = (canvas.clientWidth / bufferLength) * 2.5;
            let x = 0;

            // Create gradient that changes with audio intensity
            const maxFreq = Math.max(...Array.from(dataArray));
            const intensity = maxFreq / 255;

            const gradient = canvasCtx.createLinearGradient(0, 0, 0, canvas.clientHeight);
            gradient.addColorStop(0, `rgba(${255 * intensity}, 0, 255, 0.8)`);
            gradient.addColorStop(1, `rgba(0, 255, ${255 * (1 - intensity)}, 0.5)`);

            canvasCtx.fillStyle = gradient;

            for (let i = 0; i < bufferLength; i++) {
                const barHeight = dataArray[i] / 2;

                // Add a slight curve to the visualization
                const heightMultiplier = 0.8 + 0.4 * Math.sin((i / bufferLength) * Math.PI);

                canvasCtx.fillRect(x, canvas.clientHeight - barHeight * heightMultiplier,
                    barWidth, barHeight * heightMultiplier);
                x += barWidth + 1;
            }
        };

        renderCanvas();

        return () => {
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        };
    }, [enabled, audioElement]);

    if (!enabled || !audioElement) return null;

    return (
        <>
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
                    opacity: 0.7,
                    display: wavesurferRef.current ? 'block' : 'none' // Only show if WaveSurfer is available
                }}
            />
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
                    display: wavesurferRef.current ? 'none' : 'block' // Show as fallback
                }}
            />
        </>
    );
}