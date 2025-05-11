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
            // Try multiple selector approaches with broader criteria
            const audioElements = document.querySelectorAll('audio');
            console.log('Found audio elements:', audioElements.length);

            // Check for iframes that might contain audio elements
            const iframes = document.querySelectorAll('iframe');
            console.log('Found iframes:', iframes.length);

            // Try to access audio in iframes
            iframes.forEach(iframe => {
                try {
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                    if (iframeDoc) {
                        const iframeAudio = iframeDoc.querySelectorAll('audio');
                        console.log(`Found ${iframeAudio.length} audio elements in iframe`);

                        if (iframeAudio.length > 0) {
                            setAudioElement(iframeAudio[0] as HTMLAudioElement);
                            setIsPlaying(true);
                        }
                    }
                } catch (e) {
                    console.log('Cannot access iframe content due to same-origin policy');
                }
            });

            if (audioElements.length > 0) {
                // Log more details about the found elements
                console.log('Audio elements details:',
                    Array.from(audioElements).map(el => ({
                        hasDataAttr: !!(el as HTMLElement).dataset.spotifyPlayer,
                        src: (el as HTMLAudioElement).src,
                        paused: (el as HTMLAudioElement).paused
                    }))
                );

                // Try to find one that's playing or has a source
                const playingAudio = Array.from(audioElements).find(
                    audio => !audio.paused || (audio.src && audio.src !== '')
                );

                if (playingAudio) {
                    console.log('Found playing audio:', playingAudio);
                    setAudioElement(playingAudio as HTMLAudioElement);
                    setIsPlaying(true);
                } else {
                    setAudioElement(audioElements[0] as HTMLAudioElement);
                    setIsPlaying(true);
                }
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
                // First try direct connection
                sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audioElement);
                sourceNodeRef.current.connect(analyserRef.current!);
                console.log('Connected directly to audio element');
            } catch (err) {
                console.error('Direct connection failed:', err);

                // Then try stream capture if available
                try {
                    const stream = audioElement.mozCaptureStream?.() ||
                        audioElement.captureStream?.();

                    if (stream) {
                        sourceNodeRef.current = audioContextRef.current.createMediaStreamSource(stream);
                        sourceNodeRef.current.connect(analyserRef.current!);
                        console.log('Connected via media stream capture');
                    } else {
                        throw new Error('Stream capture not available');
                    }
                } catch (streamErr) {
                    console.error('Stream capture failed:', streamErr);

                    // Last resort - try system audio capture
                    try {
                        console.log('Trying system audio capture');
                        navigator.mediaDevices.getDisplayMedia({ audio: true, video: false })
                            .then(stream => {
                                sourceNodeRef.current = audioContextRef.current!.createMediaStreamSource(stream);
                                sourceNodeRef.current.connect(analyserRef.current!);
                                console.log('Connected using system audio');
                            })
                            .catch(err => console.error('System audio capture failed:', err));
                    } catch (sysErr) {
                        console.error('All audio capture methods failed');
                    }
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

        // Set up canvas visualization as fallback
        const canvas = canvasRef.current;
        const canvasCtx = canvas.getContext('2d');
        if (!canvasCtx) return;

        // Set canvas dimensions
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;

        const renderCanvas = () => {
            if (!analyserRef.current || !canvasCtx) return;

            const bufferLength = analyserRef.current.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            analyserRef.current.getByteFrequencyData(dataArray);

            // Clear canvas
            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

            // Create a more dynamic visualization
            const barWidth = (canvas.width / bufferLength) * 2.5;
            let x = 0;

            // Create gradient that changes with audio intensity
            const maxFreq = Math.max(...Array.from(dataArray));
            const intensity = maxFreq / 255;

            const gradient = canvasCtx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, `rgba(${255 * intensity}, 0, 255, 0.8)`);
            gradient.addColorStop(1, `rgba(0, 255, ${255 * (1 - intensity)}, 0.5)`);

            canvasCtx.fillStyle = gradient;

            for (let i = 0; i < bufferLength; i++) {
                const barHeight = dataArray[i] / 2;

                // Add a slight curve to the visualization
                const heightMultiplier = 0.8 + 0.4 * Math.sin((i / bufferLength) * Math.PI);

                canvasCtx.fillRect(x, canvas.height - barHeight * heightMultiplier, barWidth, barHeight * heightMultiplier);
                x += barWidth + 1;
            }

            requestAnimationFrame(renderCanvas);
        };

        renderCanvas();

    }, [enabled, audioElement]);

    // Add this useEffect to connect directly with the SpotifyWidget
    useEffect(() => {
        if (!enabled) return;

        // Create a custom event for the SpotifyWidget to dispatch when audio is playing
        const handleSpotifyAudio = (event: CustomEvent) => {
            if (event.detail?.audioElement) {
                console.log('Received audio element from SpotifyWidget:', event.detail.audioElement);
                setAudioElement(event.detail.audioElement);
                setIsPlaying(true);
            }
        };

        window.addEventListener('spotify-audio-element', handleSpotifyAudio as EventListener);

        return () => {
            window.removeEventListener('spotify-audio-element', handleSpotifyAudio as EventListener);
        };
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