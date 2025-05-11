// Add this component to your DashboardGrid.tsx file or create a new file
import { useState, useEffect, useRef } from 'react';
import { AudioVisualizer } from 'react-audio-visualize';

interface AudioVisualizerProps {
    enabled: boolean;
}

export default function DashboardAudioVisualizer({ enabled }: AudioVisualizerProps) {
    const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const visualizerRef = useRef<HTMLDivElement>(null);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

    // Connect to Spotify audio elements
    useEffect(() => {
        if (!enabled) return;

        const findAndConnectSpotifyAudio = () => {
            const audioElements = document.querySelectorAll('audio[data-spotify-player="true"]');
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

    useEffect(() => {
        if (!audioElement?.src) return;
        fetch(audioElement.src)
            .then(r => r.blob())
            .then(setAudioBlob);
    }, [audioElement?.src]);

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
        >
            {audioBlob && (
                <AudioVisualizer
                    blob={audioBlob}
                    barWidth={2}
                    gap={2}
                    barColor="rgba(255, 0, 255, 0.5)"
                    barPlayedColor="rgba(255, 0, 255, 0.8)"
                    height={100}
                    width={window.innerWidth}
                />
            )}
        </div>
    );
}