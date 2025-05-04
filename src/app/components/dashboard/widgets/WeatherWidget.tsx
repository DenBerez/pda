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

interface WeatherWidgetProps {
    widget: Widget;
    editMode: boolean;
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
    };
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ widget, editMode }) => {
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [city, setCity] = useState('London'); // Default city

    useEffect(() => {
        // If widget has config with city, use that
        if (widget.config?.city) {
            setCity(widget.config.city);
        }
    }, [widget]);

    useEffect(() => {
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

        fetchWeatherData();

        // Refresh weather data every 30 minutes
        const intervalId = setInterval(fetchWeatherData, 30 * 60 * 1000);

        return () => clearInterval(intervalId);
    }, [city]);

    // Function to get weather icon based on condition
    const getWeatherIcon = (condition: string) => {
        const conditionLower = condition.toLowerCase();

        if (conditionLower.includes('sun') || conditionLower.includes('clear')) {
            return <WbSunnyIcon fontSize="large" sx={{ color: '#FFD700' }} />;
        } else if (conditionLower.includes('cloud')) {
            return <CloudIcon fontSize="large" sx={{ color: '#A9A9A9' }} />;
        } else if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) {
            return <GrainIcon fontSize="large" sx={{ color: '#4682B4' }} />;
        } else if (conditionLower.includes('snow') || conditionLower.includes('ice')) {
            return <AcUnitIcon fontSize="large" sx={{ color: '#E0FFFF' }} />;
        } else if (conditionLower.includes('thunder') || conditionLower.includes('storm')) {
            return <ThunderstormIcon fontSize="large" sx={{ color: '#4B0082' }} />;
        } else {
            return <CloudIcon fontSize="large" />;
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress size={40} />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography color="error">{error}</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                    Please check your connection and try again.
                </Typography>
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
        <Box sx={{ height: '100%', overflow: 'auto' }}>
            <Box sx={{ p: 1 }}>
                {/* Location and Date */}
                <Box sx={{ mb: 2, textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {weatherData.location.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {weatherData.location.country}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {weatherData.location.localtime}
                    </Typography>
                </Box>

                {/* Current Weather */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                    <Box sx={{ mr: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {getWeatherIcon(weatherData.current.condition.text)}
                    </Box>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 'medium' }}>
                            {weatherData.current.temp_c}°C
                        </Typography>
                        <Typography variant="body2">
                            {weatherData.current.condition.text}
                        </Typography>
                    </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Weather Details */}
                <Grid container spacing={1}>
                    <Grid container key="feelslike">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <ThermostatIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="body2">
                                Feels like: {weatherData.current.feelslike_c}°C
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid container key="wind">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <AirIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="body2">
                                Wind: {weatherData.current.wind_kph} km/h {weatherData.current.wind_dir}
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid container key="humidity">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <OpacityIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="body2">
                                Humidity: {weatherData.current.humidity}%
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid container key="precip">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <WaterIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="body2">
                                Precip: {weatherData.current.precip_mm} mm
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid container key="visibility">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <VisibilityIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="body2">
                                Visibility: {weatherData.current.vis_km} km
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid container key="pressure">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box component="span" sx={{ mr: 1, fontSize: '1.2rem' }}>🔍</Box>
                            <Typography variant="body2">
                                Pressure: {weatherData.current.pressure_mb} mb
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
};

export default WeatherWidget; 