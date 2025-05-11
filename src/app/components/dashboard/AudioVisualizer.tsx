// Add this component to your DashboardGrid.tsx file or create a new file
import { useState, useEffect, useRef, useCallback } from 'react';

interface Particle {
    element: HTMLElement;
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    startTime: number;
    duration: number;
    update: () => boolean;
}




interface AudioVisualizerProps {
    enabled: boolean;
}

export default function DashboardAudioVisualizer({ enabled }: AudioVisualizerProps) {
    const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
    const [analyzer, setAnalyzer] = useState<AnalyserNode | null>(null);
    const [dataArray, setDataArray] = useState<Uint8Array | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    const particlesRef = useRef<Particle[]>([]);
    let beatThreshold = 10;
    let beatHoldTime = 100;
    let beatDecayRate = 0.99;
    let beatCutOff = 10;
    let lastBeatTime = 0;

    // Initialize audio context and analyzer
    useEffect(() => {
        if (!enabled) return;

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const context = new AudioContext();
        const analyzerNode = context.createAnalyser();

        analyzerNode.fftSize = 256;
        const bufferLength = analyzerNode.frequencyBinCount;
        const dataArr = new Uint8Array(bufferLength);

        setAudioContext(context);
        setAnalyzer(analyzerNode);
        setDataArray(dataArr);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
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
        };
    }, [enabled, audioContext, analyzer]);

    // Create particles on beat detection
    const createParticle = useCallback((x: number, y: number) => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const particle = document.createElement('div');
        const size = Math.random() * 15 + 5;
        const hue = Math.random() * 360;
        const duration = Math.random() * 1000 + 500;

        particle.style.position = 'absolute';
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.borderRadius = '50%';
        particle.style.background = `hsla(${hue}, 100%, 60%, 0.8)`;
        particle.style.boxShadow = `0 0 ${size / 2}px hsla(${hue}, 100%, 60%, 0.5)`;
        particle.style.pointerEvents = 'none';

        document.body.appendChild(particle);

        const startTime = Date.now();
        const vx = (Math.random() - 0.5) * 3;
        const vy = (Math.random() - 0.5) * 3 - 2; // Slight upward bias

        const newParticle: Particle = {
            element: particle,
            x,
            y,
            vx,
            vy,
            life: 1,
            startTime,
            duration,
            update: () => {
                const elapsed = Date.now() - startTime;
                newParticle.life = 1 - elapsed / duration;

                if (newParticle.life <= 0) {
                    particle.remove();
                    return false;
                }

                newParticle.x += vx;
                newParticle.y += vy;
                newParticle.vy += 0.05; // Gravity

                particle.style.opacity = newParticle.life.toString();
                particle.style.transform = `translate(${newParticle.x}px, ${newParticle.y}px) scale(${newParticle.life})`;

                return true;
            }
        };

        particlesRef.current.push(newParticle);
        return newParticle;
    }, []);

    // Draw visualization
    const draw = useCallback(() => {
        if (!enabled || !analyzer || !dataArray || !canvasRef.current) {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            return;
        }

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Make canvas full screen
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Get frequency data
        analyzer.getByteFrequencyData(dataArray);

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Calculate average frequency and detect beats
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
        }
        const average = sum / dataArray.length;

        // Beat detection
        if (average > beatCutOff && average > beatThreshold) {
            const now = Date.now();
            if (now - lastBeatTime > beatHoldTime) {
                // Create particles on beat
                for (let i = 0; i < 5; i++) {
                    const x = Math.random() * canvas.width;
                    const y = canvas.height;
                    createParticle(x, y);
                }
                lastBeatTime = now;
            }
            beatCutOff = average * 1.1;
            beatCutOff = Math.min(beatCutOff, 100);
        } else {
            beatCutOff *= beatDecayRate;
            beatCutOff = Math.max(beatCutOff, beatThreshold);
        }

        // Draw bars
        const barWidth = (canvas.width / dataArray.length) * 2.5;
        let x = 0;

        for (let i = 0; i < dataArray.length; i++) {
            const barHeight = dataArray[i] * 1.5;

            // Use gradient colors based on frequency
            const hue = i * 2;
            ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.5)`;

            // Draw bar with rounded corners
            ctx.beginPath();
            ctx.roundRect(
                x,
                canvas.height - barHeight,
                barWidth - 1,
                barHeight,
                5
            );
            ctx.fill();

            x += barWidth;
        }

        // Update particles
        particlesRef.current = particlesRef.current.filter(particle => particle.update());

        // Continue animation loop
        animationRef.current = requestAnimationFrame(draw);
    }, [enabled, analyzer, dataArray, createParticle]);

    // Start animation loop
    useEffect(() => {
        if (enabled) {
            draw();
        }

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }

            // Clean up particles
            particlesRef.current.forEach(particle => {
                particle.element.remove();
            });
            particlesRef.current = [];
        };
    }, [enabled, draw]);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            if (canvasRef.current) {
                canvasRef.current.width = window.innerWidth;
                canvasRef.current.height = window.innerHeight;
            }
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    if (!enabled) return null;

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 1,
                opacity: 0.7
            }}
        />
    );
};