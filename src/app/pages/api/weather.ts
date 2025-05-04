import { NextApiRequest, NextApiResponse } from "next"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        try {
            const { city } = req.query;

            if (!city) {
                return res.status(400).json({ error: 'City parameter is required' });
            }

            // Replace with your actual API key from your weather provider
            const apiKey = process.env.WEATHER_API_KEY;

            // Example using OpenWeatherMap
            const response = await fetch(
                `http://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}&aqi=no`
            );

            if (!response.ok) {
                throw new Error('Weather API request failed');
            }

            const weatherData = await response.json();
            return res.status(200).json(weatherData);
        } catch (error) {
            console.error('Weather API error:', error);
            return res.status(500).json({ error: 'Failed to fetch weather data' });
        }
    }

    if (req.method === 'POST') {
        const { name } = req.body
        return res.status(200).json({ message: `User ${name} created!` })
    }

    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
}