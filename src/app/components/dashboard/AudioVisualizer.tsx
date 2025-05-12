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

        console.log('Setting up WaveSurfer for element:', audioElement);

        // Create audio context and analyzer if they don't exist
        if (!audioContextRef.current) {
            try {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
                console.log('Created audio context:', audioContextRef.current);

                analyserRef.current = audioContextRef.current.createAnalyser();
                analyserRef.current.fftSize = 256;
                console.log('Created analyzer node');
            } catch (err) {
                console.error('Failed to create audio context or analyzer:', err);
                return;
            }
        }

        // Initialize WaveSurfer
        if (!wavesurferRef.current) {
            try {
                wavesurferRef.current = WaveSurfer.create({
                    container: visualizerRef.current,
                    waveColor: 'rgba(100, 100, 255, 0.4)',
                    progressColor: 'rgba(150, 100, 255, 0.8)',
                    cursorColor: 'transparent',
                    barWidth: 2,
                    barGap: 1,
                    barRadius: 3,
                    height: 80,
                    normalize: true,
                    interact: false,
                });
                console.log('WaveSurfer initialized');
            } catch (err) {
                console.error('Failed to initialize WaveSurfer:', err);
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

                // Connect WaveSurfer to the audio element
                wavesurferRef.current!.load(audioElement.src);

                // Use the media element directly
                wavesurferRef.current!.setMediaElement(audioElement);

                console.log('Connected directly to audio element with WaveSurfer');
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

                    // For stream capture, we need to manually update WaveSurfer
                    updateWaveSurferWithAnalyzer();

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

                // For system audio, we need to manually update WaveSurfer
                updateWaveSurferWithAnalyzer();

                console.log('Connected using system audio');
                return true;
            } catch (err) {
                console.error('All audio capture methods failed');
                return false;
            }
        };

        // Function to update WaveSurfer with analyzer data
        const updateWaveSurferWithAnalyzer = () => {
            if (!analyserRef.current || !wavesurferRef.current) return;

            const bufferLength = analyserRef.current.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const updateWaveform = () => {
                analyserRef.current!.getByteFrequencyData(dataArray);

                // Convert frequency data to waveform-like data
                const waveformData = Array.from(dataArray).map(val => val / 255);

                // Update WaveSurfer with this data if possible
                // Note: This is a simplified approach - WaveSurfer might not have a direct API for this
                // You might need to use a custom drawer or plugin

                animationRef.current = requestAnimationFrame(updateWaveform);
            };

            updateWaveform();
        };

        connectAudio();

        // Start WaveSurfer if audio is playing
        if (!audioElement.paused) {
            wavesurferRef.current?.play();
        }

        // Listen for play/pause events
        const handlePlay = () => {
            wavesurferRef.current?.play();
            setIsPlaying(true);
        };

        const handlePause = () => {
            wavesurferRef.current?.pause();
            setIsPlaying(false);
        };

        audioElement.addEventListener('play', handlePlay);
        audioElement.addEventListener('pause', handlePause);

        return () => {
            if (sourceNodeRef.current) {
                sourceNodeRef.current.disconnect();
                sourceNodeRef.current = null;
            }

            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }

            audioElement.removeEventListener('play', handlePlay);
            audioElement.removeEventListener('pause', handlePause);

            wavesurferRef.current?.destroy();
            wavesurferRef.current = null;
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
                    display: 'block' // Always show the WaveSurfer container
                }}
            />
            {/* Keep the canvas as a fallback but hide it by default */}
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
                    display: 'none' // Hide by default, could add logic to show if WaveSurfer fails
                }}
            />
        </>
    );
}