'use client';

import { useEffect, useState } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  username?: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/auth/status', { credentials: 'include' })
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

    // Initialize Google Translate Widget
    const googleTranslateScript = document.createElement('script');
    googleTranslateScript.type = 'text/javascript';
    googleTranslateScript.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    document.body.appendChild(googleTranslateScript);

    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        { pageLanguage: 'en' },
        'google_translate_element'
      );
    };
  }, []);

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
        {/* google translate widget */}
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
        <a
          href="http://localhost:5000/auth/logout"
          className="px-6 py-2 text-white bg-red-500 rounded hover:bg-red-600"
        >
          Logout
        </a>
      </div>
    </div>
  );
}
