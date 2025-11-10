'use client';

import { useEffect, useState } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  username?: string;
}

interface Weather {
  temperature: number;
  description: string;
  city: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [backendURL, setBackendURL] = useState('');

  useEffect(() => {
    const url = typeof window !== 'undefined' && window.location.hostname === 'localhost'
      ? 'http://localhost:5000'
      : (process.env.NEXT_PUBLIC_API_URL || 'https://gang53-project-3-backend.vercel.app');
    setBackendURL(url);
  }, []);

  // Load Google Translate widget
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).googleTranslateElementInit = function() {
        new (window as any).google.translate.TranslateElement(
          { pageLanguage: 'en' },
          'google_translate_element'
        );
      };

      // Load the translate script
      const script = document.createElement('script');
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (!backendURL) return;
    
    fetch(`${backendURL}/auth/status`, { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          const userData = data.user;

          let displayName = 'Unknown User';
          if (typeof userData.name === 'string') {
            displayName = userData.name;
          } else if (userData.displayName) {
            displayName = userData.displayName;
          } else if (userData.name && typeof userData.name === 'object') {
            const nameObj = userData.name as any;
            if (nameObj.givenName && nameObj.familyName) {
              displayName = `${nameObj.givenName} ${nameObj.familyName}`;
            } else if (nameObj.givenName) {
              displayName = nameObj.givenName;
            } else if (nameObj.familyName) {
              displayName = nameObj.familyName;
            }
          } else if (userData._json?.name) {
            displayName = userData._json.name;
          }

          setUser({
            id: userData.id || userData._json?.sub || 'unknown',
            name: displayName,
            email: userData.email || userData._json?.email || userData.emails?.[0]?.value || 'No email',
            username: userData.username
          });
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });

    // Fetch weather data
    const fetchWeather = async () => {
      const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
      const city = 'College Station'; 
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;

      try {
        const response = await fetch(url);
        const data = await response.json();
        if (data && data.main && data.weather) {
          setWeather({
            temperature: data.main.temp,
            description: data.weather[0].description,
            city: data.name,
          });
        }
      } catch (error) {
        console.error('Error fetching weather data:', error);
      }
    };

    fetchWeather();
  }, [backendURL]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Loading...</h1>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Not Logged In
          </h1>
          <a
            href="http://localhost:3000/login"
            className="px-6 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <div className="text-center">
        {/* Google Translate Widget */}
        <div id="google_translate_element" className="mb-4"></div>

        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Welcome, {user.name}!
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
          Email: {user.email}
        </p>
        {user.username && (
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
            Username: {user.username}
          </p>
        )}

        {/* Weather Information */}
        {weather && (
          <div className="mt-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Weather in {weather.city}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Temperature: {weather.temperature}°C
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Description: {weather.description}
            </p>
          </div>
        )}

        <a
          href={`${backendURL}/auth/logout`}
          className="mt-24 px-6 py-2 text-white bg-red-500 rounded hover:bg-red-600"
        >
          Logout
        </a>
      </div>
    </div>
  );
}