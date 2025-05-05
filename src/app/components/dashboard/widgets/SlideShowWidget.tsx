import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    IconButton,
    CircularProgress,
    Paper,
    useTheme
} from '@mui/material';
import { Widget } from '../types';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';

// Sample images for demonstration
const sampleImages = [
    {
        url: 'https://picsum.photos/200/300',
        caption: 'Beautiful Nature'
    },
    {
        url: 'https://picsum.photos/400/200',
        caption: 'City Landscape'
    },
    {
        url: 'https://picsum.photos/200/350',
        caption: 'Relaxing Beach'
    },
    {
        url: 'https://picsum.photos/300/250',
        caption: 'Mountain View'
    },
    {
        url: 'https://picsum.photos/200/450',
        caption: 'Forest Adventure'
    }
];

interface SlideShowWidgetProps {
    widget: Widget;
    editMode: boolean;
}

interface SlideImage {
    url: string;
    caption?: string;
}

const slideAnimationStyles = `
  @keyframes slide-next {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }
  
  @keyframes slide-prev {
    from { transform: translateX(-100%); }
    to { transform: translateX(0); }
  }
`;

const SlideShowWidget: React.FC<SlideShowWidgetProps> = ({ widget, editMode }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [images, setImages] = useState<SlideImage[]>(sampleImages);
    const [imageError, setImageError] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const theme = useTheme();

    // Refs for touch events and fullscreen
    const touchStartX = useRef<number | null>(null);
    const touchEndX = useRef<number | null>(null);
    const fullscreenRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Get configuration from widget or use defaults
    const interval = widget.config?.interval || 5000; // Default: 5 seconds
    const showCaptions = widget.config?.showCaptions !== false; // Default: true
    const transition = widget.config?.transition || 'fade'; // Default: fade, options: fade, slide

    // Load images from widget config if available
    useEffect(() => {
        if (widget.config?.images && widget.config.images.length > 0) {
            setImages(widget.config.images);
        }

        // Simulate loading delay
        setTimeout(() => {
            setIsLoading(false);
        }, 500);
    }, [widget.config]);

    // Handle auto-play
    useEffect(() => {
        if (isPlaying && !editMode) {
            timerRef.current = setInterval(() => {
                setCurrentIndex(prevIndex => (prevIndex + 1) % images.length);
            }, interval);
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [isPlaying, images.length, interval, editMode]);

    // Preload next image
    useEffect(() => {
        const nextIndex = (currentIndex + 1) % images.length;
        if (nextIndex !== currentIndex && images[nextIndex]) {
            const img = new Image();
            img.src = images[nextIndex].url;
        }

        // Reset image loading state when changing slides
        setImageLoading(true);
    }, [currentIndex, images]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (editMode) return;

            switch (e.key) {
                case 'ArrowLeft':
                    prevSlide();
                    break;
                case 'ArrowRight':
                    nextSlide();
                    break;
                case ' ': // Space key
                    togglePlayPause();
                    e.preventDefault();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [editMode]);

    // Fullscreen change detection
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    // Navigation functions
    const nextSlide = () => {
        setCurrentIndex(prevIndex => (prevIndex + 1) % images.length);
    };

    const prevSlide = () => {
        setCurrentIndex(prevIndex => (prevIndex - 1 + images.length) % images.length);
    };

    const togglePlayPause = () => {
        setIsPlaying(!isPlaying);
    };

    const toggleFullscreen = () => {
        if (!fullscreenRef.current) return;

        if (!document.fullscreenElement) {
            fullscreenRef.current.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    // Touch handlers
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStartX.current) return;

        touchEndX.current = e.changedTouches[0].clientX;

        // Calculate swipe distance
        const swipeDistance = touchEndX.current - touchStartX.current;

        // If swipe distance is significant (more than 50px)
        if (Math.abs(swipeDistance) > 50) {
            if (swipeDistance > 0) {
                // Swiped right - go to previous slide
                prevSlide();
            } else {
                // Swiped left - go to next slide
                nextSlide();
            }
        }

        // Reset values
        touchStartX.current = null;
        touchEndX.current = null;
    };

    // Image handlers
    const handleImageError = () => {
        setImageError(true);
        setImageLoading(false);
        console.error(`Failed to load image: ${images[currentIndex].url}`);
    };

    const handleImageLoad = () => {
        setImageLoading(false);
        setImageError(false);
    };

    if (isLoading) {
        return (
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%'
            }}>
                <CircularProgress size={40} />
            </Box>
        );
    }

    return (
        <Box
            ref={fullscreenRef}
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden',
                bgcolor: 'background.paper',
                borderRadius: isFullscreen ? 0 : 1
            }}
        >
            <style>{slideAnimationStyles}</style>
            {/* Main image container */}
            <Box
                sx={{
                    flexGrow: 1,
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'black'
                }}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                role="region"
                aria-label="Image slideshow"
                tabIndex={0}
            >
                {images.length > 0 ? (
                    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                        {imageLoading && (
                            <Box sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: 'rgba(0,0,0,0.1)'
                            }}>
                                <CircularProgress size={40} />
                            </Box>
                        )}
                        <Box
                            component="img"
                            src={images[currentIndex].url}
                            alt={images[currentIndex].caption || `Slide ${currentIndex + 1}`}
                            onError={handleImageError}
                            onLoad={handleImageLoad}
                            sx={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                transition:
                                    transition === 'fade'
                                        ? 'opacity 0.5s ease-in-out'
                                        : transition === 'slide'
                                            ? 'transform 0.5s ease-in-out'
                                            : 'none',
                                opacity: imageError ? 0.3 : imageLoading ? 0 : 1,
                                transform: transition === 'slide'
                                    ? `translateX(${0}%)`
                                    : 'none',
                                animation: transition === 'slide' && !imageLoading
                                    ? `slide-${isPlaying ? 'next' : 'prev'} 0.5s ease-in-out`
                                    : 'none',
                            }}
                        />
                    </Box>
                ) : (
                    <Typography variant="body1" color="text.secondary">
                        No images available
                    </Typography>
                )}

                {/* Navigation arrows */}
                <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    px: 2,
                    opacity: 0.7,
                    '&:hover': { opacity: 1 },
                    transition: 'opacity 0.3s ease'
                }}>
                    <IconButton
                        onClick={prevSlide}
                        aria-label="Previous slide"
                        sx={{
                            bgcolor: 'rgba(0,0,0,0.3)',
                            color: 'white',
                            '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' }
                        }}
                    >
                        <ArrowBackIosNewIcon />
                    </IconButton>
                    <IconButton
                        onClick={nextSlide}
                        aria-label="Next slide"
                        sx={{
                            bgcolor: 'rgba(0,0,0,0.3)',
                            color: 'white',
                            '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' }
                        }}
                    >
                        <ArrowForwardIosIcon />
                    </IconButton>
                </Box>

                {/* Slide indicators */}
                <Box sx={{
                    position: 'absolute',
                    bottom: showCaptions ? 50 : 10,
                    left: 0,
                    right: 0,
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 1,
                    px: 2,
                    zIndex: 2
                }}>
                    {images.map((_, index) => (
                        <Box
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: index === currentIndex ? 'primary.main' : 'rgba(255,255,255,0.5)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    transform: 'scale(1.2)',
                                    bgcolor: index === currentIndex ? 'primary.main' : 'rgba(255,255,255,0.8)'
                                }
                            }}
                        />
                    ))}
                </Box>
            </Box>

            {/* Caption and controls */}
            <Box sx={{
                p: 1,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: `1px solid ${theme.palette.divider}`
            }}>
                {showCaptions && images[currentIndex]?.caption ? (
                    <Typography variant="body2" sx={{ flexGrow: 1, mr: 2 }}>
                        {images[currentIndex].caption}
                    </Typography>
                ) : (
                    <Box sx={{ flexGrow: 1 }} />
                )}

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                        {currentIndex + 1} / {images.length}
                    </Typography>
                    <IconButton size="small" onClick={togglePlayPause}>
                        {isPlaying ? <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
                    </IconButton>
                    <IconButton size="small" onClick={toggleFullscreen} sx={{ ml: 1 }}>
                        {isFullscreen ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
                    </IconButton>
                </Box>
            </Box>
        </Box>
    );
};

export default SlideShowWidget; 