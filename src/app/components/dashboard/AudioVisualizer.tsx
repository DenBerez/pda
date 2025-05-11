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

        const findAndConnectSpotifyAudio = () => {
            // Try multiple selector approaches
            const audioElements = document.querySelectorAll('audio[data-spotify-player="true"], audio');
            console.log('Found audio elements:', audioElements.length);

            if (audioElements.length > 0) {
                // Log more details about the found elements
                console.log('Audio elements details:',
                    Array.from(audioElements).map(el => ({
                        hasDataAttr: !!(el as HTMLElement).dataset.spotifyPlayer,
                        src: (el as HTMLAudioElement).src,
                        paused: (el as HTMLAudioElement).paused
                    }))
                );

                setAudioElement(audioElements[0] as HTMLAudioElement);
                setIsPlaying(true);
            }
        };

        // Listen for Spotify player ready event
        const handleSpotifyPlayerReady = (event: Event) => {
            console.log('Spotify player ready event received', event);

            // Handle both CustomEvent and regular Event
            const customEvent = event as CustomEvent;
            if (customEvent.detail?.audioElement) {
                console.log('Audio element found in event:', customEvent.detail.audioElement);
                setAudioElement(customEvent.detail.audioElement);
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

        console.log('Setting up audio context for element:', audioElement);

        // Create audio context and analyzer
        if (!audioContextRef.current) {
            try {
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
                console.log('Created audio context:', audioContextRef.current);
            } catch (err) {
                console.error('Failed to create audio context:', err);
                return;
            }
        }

        if (!analyserRef.current) {
            try {
                analyserRef.current = audioContextRef.current.createAnalyser();
                analyserRef.current.fftSize = 256;
                console.log('Created analyzer node');
            } catch (err) {
                console.error('Failed to create analyzer:', err);
                return;
            }
        }

        // Connect audio element to analyzer with error handling
        if (!sourceNodeRef.current && audioElement) {
            try {
                // Check if the audio element is already connected to another context
                const stream = audioElement.mozCaptureStream?.() ||
                    audioElement.captureStream?.() ||
                    new MediaStream();
                sourceNodeRef.current = audioContextRef.current.createMediaStreamSource(stream);
                sourceNodeRef.current?.connect(analyserRef.current!);
                analyserRef.current?.connect(audioContextRef.current!.destination);
                console.log('Connected audio element to analyzer');
            } catch (err) {
                console.error('Failed to connect audio element:', err);
                // Try alternative approach if the first one fails
                try {
                    // If we can't connect directly, try to create a silent audio element
                    // and use the microphone to capture system audio
                    console.log('Trying alternative audio capture method');
                    navigator.mediaDevices.getUserMedia({ audio: true })
                        .then(stream => {
                            sourceNodeRef.current = audioContextRef.current!.createMediaStreamSource(stream);
                            sourceNodeRef.current.connect(analyserRef.current!);
                            analyserRef.current!.connect(audioContextRef.current!.destination);
                            console.log('Connected using microphone input');
                        })
                        .catch(micErr => {
                            console.error('Failed to access microphone:', micErr);
                        });
                } catch (altErr) {
                    console.error('Alternative method also failed:', altErr);
                }
            }
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

    // Add this useEffect after your existing ones
    useEffect(() => {
        if (!enabled) return;

        // Try to directly access the audio element from SpotifyWidget
        const connectToSpotifyWidgetAudio = () => {
            // Look for any audio elements that might be playing Spotify content
            const allAudioElements = document.querySelectorAll('audio');
            console.log('All audio elements found:', allAudioElements.length);

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
                    opacity: 0.7
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
                    display: wavesurferRef.current ? 'none' : 'block' // Only show if WaveSurfer fails
                }}
            />
        </>
    );
}