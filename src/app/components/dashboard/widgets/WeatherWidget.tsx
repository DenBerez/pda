import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Paper, Grid, Divider } from '@mui/material';
import { Widget } from '../types';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import CloudIcon from '@mui/icons-material/Cloud';
import GrainIcon from '@mui/icons-material/Grain';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import ThunderstormIcon from '@mui/icons-material/Thunderstorm';
import WaterIcon from '@mui/icons-material/Water';
import AirIcon from '@mui/icons-material/Air';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import VisibilityIcon from '@mui/icons-material/Visibility';
import OpacityIcon from '@mui/icons-material/Opacity';
import SpeedIcon from '@mui/icons-material/Speed';

const sampleWeatherData =
{
    "location": {
        "name": "London",
        "region": "City of London, Greater London",
        "country": "United Kingdom",
        "lat": 51.5171,
        "lon": -0.1062,
        "tz_id": "Europe/London",
        "localtime_epoch": 1746370968,
        "localtime": "2025-05-04 16:02"
    },
    "current": {
        "last_updated_epoch": 1746370800,
        "last_updated": "2025-05-04 16:00",
        "temp_c": 13.4,
        "temp_f": 56.1,
        "is_day": 1,
        "condition": {
            "text": "Partly cloudy",
            "icon": "//cdn.weatherapi.com/weather/64x64/day/116.png",
            "code": 1003
        },
        "wind_mph": 12.5,
        "wind_kph": 20.2,
        "wind_degree": 19,
        "wind_dir": "NNE",
        "pressure_mb": 1018,
        "pressure_in": 30.06,
        "precip_mm": 0,
        "precip_in": 0,
        "humidity": 47,
        "cloud": 75,
        "feelslike_c": 11.7,
        "feelslike_f": 53,
        "windchill_c": 8.1,
        "windchill_f": 46.6,
        "heatindex_c": 10.6,
        "heatindex_f": 51,
        "dewpoint_c": 1.7,
        "dewpoint_f": 35.1,
        "vis_km": 10,
        "vis_miles": 6,
        "uv": 1,
        "gust_mph": 15.3,
        "gust_kph": 24.6
    }
}



interface WeatherWidgetProps {
    widget: Widget;
    editMode: boolean;
    colorScheme?: {
        background?: string;
        text?: string;
        card?: string;
        primary?: string;
        icons?: {
            sun?: string;
            cloud?: string;
            rain?: string;
            snow?: string;
            thunder?: string;
            temperature?: string;
            wind?: string;
            humidity?: string;
            precipitation?: string;
            visibility?: string;
            pressure?: string;
        }
    };
}

interface WeatherData {
    location: {
        name: string;
        region: string;
        country: string;
        localtime: string;
    };
    current: {
        temp_c: number;
        temp_f: number;
        condition: {
            text: string;
            icon: string;
        };
        wind_kph: number;
        wind_dir: string;
        humidity: number;
        feelslike_c: number;
        pressure_mb: number;
        vis_km: number;
        precip_mm: number;
        cloud: number;
    };
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ widget, editMode, colorScheme }) => {
    const [weatherData, setWeatherData] = useState<WeatherData>(sampleWeatherData);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [city, setCity] = useState(widget.config?.city || 'London');

    // Get units from widget config or default to celsius
    const units = widget.config?.units || 'celsius';

    // Get refresh rate from widget config or default to 30 minutes
    const refreshRate = widget.config?.refreshRate || 30;

    // Get layout option from widget config or default to 'normal'
    const layoutOption = widget.config?.layoutOption || 'normal';

    // Default color scheme that's minimalistic/grayscale
    const defaultColorScheme = {
        background: 'background.paper',
        text: 'text.primary',
        card: 'background.default',
        primary: 'primary.main',
        icons: {
            sun: 'yellow', //yellow 
            cloud: 'text.primary',
            rain: 'blue',
            snow: 'white',
            thunder: 'blue',
            temperature: 'text.primary',
            wind: 'text.primary',
            humidity: 'text.primary',
            precipitation: 'text.primary',
            visibility: 'text.primary',
            pressure: 'text.primary'
        }
    };

    // Merge default with provided color scheme
    const theme = {
        ...defaultColorScheme,
        ...colorScheme,
        icons: {
            ...defaultColorScheme.icons,
            ...colorScheme?.icons
        }
    };

    // Add a state to track widget width
    const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
    const [isCompact, setIsCompact] = useState(false);

    // Use ResizeObserver to detect widget width changes
    useEffect(() => {
        if (!containerRef) return;

        const resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                // Set compact mode if width is less than 500px
                setIsCompact(entry.contentRect.width < 500);
            }
        });

        resizeObserver.observe(containerRef);
        return () => resizeObserver.disconnect();
    }, [containerRef]);

    useEffect(() => {
        // If widget has config with city, use that
        if (widget.config?.city) {
            setCity(widget.config.city);
        }
    }, [widget]);

    // Function to fetch weather data
    const fetchWeatherData = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);

            if (!response.ok) {
                throw new Error('Failed to fetch weather data');
            }

            const data = await response.json();
            setWeatherData(data);
        } catch (err) {
            console.error('Error fetching weather data:', err);
            setError('Failed to load weather data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWeatherData();

        // Use the configured refresh rate
        const intervalId = setInterval(fetchWeatherData, refreshRate * 60 * 1000);

        return () => clearInterval(intervalId);
    }, [city, refreshRate]);

    // Function to format temperature based on selected units
    const formatTemperature = (temp: number) => {
        if (units === 'fahrenheit') {
            // Convert to Fahrenheit
            return `${Math.round((temp * 9 / 5) + 32)}°F`;
        }
        // Default to Celsius
        return `${Math.round(temp)}°C`;
    };

    // Function to get weather icon based on condition
    const getWeatherIcon = (condition: string) => {
        const conditionLower = condition.toLowerCase();

        if (conditionLower.includes('sun') || conditionLower.includes('clear')) {
            return <WbSunnyIcon fontSize="large" sx={{ color: theme.icons.sun }} />;
        } else if (conditionLower.includes('cloud')) {
            return <CloudIcon fontSize="large" sx={{ color: theme.icons.cloud }} />;
        } else if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) {
            return <GrainIcon fontSize="large" sx={{ color: theme.icons.rain }} />;
        } else if (conditionLower.includes('snow') || conditionLower.includes('ice')) {
            return <AcUnitIcon fontSize="large" sx={{ color: theme.icons.snow }} />;
        } else if (conditionLower.includes('thunder') || conditionLower.includes('storm')) {
            return <ThunderstormIcon fontSize="large" sx={{ color: theme.icons.thunder }} />;
        } else {
            return <CloudIcon fontSize="large" sx={{ color: theme.icons.cloud }} />;
        }
    };

    // Render functions for each layout
    const renderCompactLayout = () => (
        <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            py: 2
        }}>
            {weatherData && (
                <Box sx={{ mr: 2 }}>
                    {getWeatherIcon(weatherData.current.condition.text)}
                </Box>
            )}
            <Box>
                <Typography variant="h4" sx={{ fontWeight: 'medium', color: theme.primary }}>
                    {formatTemperature(weatherData.current.temp_c)}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.text }}>
                    {weatherData.location.name}
                </Typography>
            </Box>
        </Box>
    );

    const renderNormalLayout = () => (
        <Box sx={{
            display: 'flex',
            flexDirection: isCompact ? 'column' : 'row',
            alignItems: isCompact ? 'center' : 'flex-start',
            justifyContent: 'space-between',
            mb: 3,
            backgroundColor: theme.card,
            borderRadius: 2,
            p: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
            {/* Location info */}
            <Box sx={{
                textAlign: isCompact ? 'center' : 'left',
                flex: '1',
                mb: isCompact ? 2 : 0
            }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: theme.primary }}>
                    {weatherData.location.name}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.text }}>
                    {weatherData.location.country}
                </Typography>
                <Typography variant="caption" sx={{ color: theme.text, display: 'block' }}>
                    {
                        new Date(weatherData.location.localtime).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })
                    }
                </Typography>
            </Box>

            {/* Current weather */}
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: '1',
                mb: isCompact ? 2 : 0
            }}>
                {weatherData && (
                    <Box sx={{ mr: 2 }}>
                        {getWeatherIcon(weatherData.current.condition.text)}
                    </Box>
                )}
                <Box>
                    <Typography variant="h3" sx={{ fontWeight: 'medium', color: theme.primary }}>
                        {formatTemperature(weatherData.current.temp_c)}
                    </Typography>
                    <Typography variant="body1" sx={{ color: theme.text }}>
                        {weatherData.current.condition.text}
                    </Typography>
                </Box>
            </Box>

            {/* Feels like */}
            <Box sx={{
                textAlign: isCompact ? 'center' : 'right',
                flex: '1'
            }}>
                <Typography variant="body2" sx={{ color: theme.text, fontWeight: 'medium' }}>
                    Feels like
                </Typography>
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isCompact ? 'center' : 'flex-end'
                }}>
                    <ThermostatIcon fontSize="small" sx={{ mr: 1, color: theme.icons.temperature }} />
                    <Typography variant="h5" sx={{ color: theme.text }}>
                        {formatTemperature(weatherData.current.feelslike_c)}
                    </Typography>
                </Box>
            </Box>
        </Box>
    );

    const renderWeatherDetails = () => (
        <>
            <Divider sx={{ my: 2 }} />
            {/* Weather Details - Improved Layout with responsive grid */}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(auto-fill, minmax(${isCompact ? '120px' : '200px'}, 1fr))`,
                    gap: 2,
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                {[
                    {
                        icon: <AirIcon fontSize="small" sx={{ color: theme.icons.wind }} />,
                        label: "Wind",
                        value: `${weatherData.current.wind_kph} km/h ${weatherData.current.wind_dir}`
                    },
                    {
                        icon: <OpacityIcon fontSize="small" sx={{ color: theme.icons.humidity }} />,
                        label: "Humidity",
                        value: `${weatherData.current.humidity}%`
                    },
                    {
                        icon: <WaterIcon fontSize="small" sx={{ color: theme.icons.precipitation }} />,
                        label: "Precipitation",
                        value: `${weatherData.current.precip_mm} mm`
                    },
                    {
                        icon: <VisibilityIcon fontSize="small" sx={{ color: theme.icons.visibility }} />,
                        label: "Visibility",
                        value: `${weatherData.current.vis_km} km`
                    },
                    {
                        icon: <SpeedIcon fontSize="small" sx={{ color: theme.icons.pressure }} />,
                        label: "Pressure",
                        value: `${weatherData.current.pressure_mb} mb`
                    },
                    {
                        icon: <CloudIcon fontSize="small" sx={{ color: theme.icons.cloud }} />,
                        label: "Cloud Coverage",
                        value: `${weatherData.current.cloud}%`
                    }
                ].map((detail, index) => (
                    <Paper
                        key={index}
                        elevation={0}
                        sx={{
                            p: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            backgroundColor: theme.card,
                            borderRadius: 2,
                            color: theme.text
                        }}
                    >
                        {detail.icon}
                        <Box sx={{ ml: 1.5 }}>
                            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                                {detail.label}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                {detail.value}
                            </Typography>
                        </Box>
                    </Paper>
                ))}
            </Box>
        </>
    );

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress size={40} />
            </Box>
        );
    }

    if (!weatherData) {
        return (
            <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography>No weather data available</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 2 }} ref={setContainerRef}>
            {/* Render the appropriate layout based on layoutOption */}
            {layoutOption === 'compact' ? (
                renderCompactLayout()
            ) : (
                renderNormalLayout()
            )}

            {/* Only show weather details for detailed layout */}
            {layoutOption === 'detailed' && renderWeatherDetails()}
        </Box>
    );
};

export default WeatherWidget; 