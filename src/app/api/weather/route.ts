import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const city = searchParams.get('city');

        if (!city) {
            return NextResponse.json({ error: 'City parameter is required' }, { status: 400 });
        }

        // Replace with your actual API key from your weather provider
        const apiKey = process.env.WEATHER_API_KEY;

        // Example using WeatherAPI.com
        const response = await fetch(
            `http://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}&aqi=no`
        );

        if (!response.ok) {
            throw new Error('Weather API request failed');
        }

        const weatherData = await response.json();
        return NextResponse.json(weatherData);
    } catch (error) {
        console.error('Weather API error:', error);
        return NextResponse.json({ error: 'Failed to fetch weather data' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const data = await request.json();
    const { name } = data;
    return NextResponse.json({ message: `User ${name} created!` });
} 