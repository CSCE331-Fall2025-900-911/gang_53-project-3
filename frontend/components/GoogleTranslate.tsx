'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: any;
  }
}

export default function GoogleTranslate() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Callback Google expects
    window.googleTranslateElementInit = () => {
      const container = document.getElementById('google_translate_element');

      // 🔥 PATCH: If container exists but is empty, re-create the internal needed structure
      // Google Translate refuses to render if previous children were removed.
      if (container && container.childElementCount === 0) {
        container.innerHTML = ''; // reset fully
      }

      // eslint-disable-next-line new-cap
      new window.google.translate.TranslateElement(
        { pageLanguage: 'en' },
        'google_translate_element'
      );
    };

    // load script only once
    const existing = document.getElementById('google-translate-script');
    if (!existing) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src =
        'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    } else {
      // 🔥 PATCH: If script exists but widget is missing, re-trigger init
      if (window.google?.translate?.TranslateElement) {
        window.googleTranslateElementInit?.();
      }
    }
  }, []);

  return (
    <div className="flex items-center justify-center gap-3">
      <span className="text-sm text-zinc-400">Translate:</span>
      <div id="google_translate_element" className="text-black" />
    </div>
  );
}
