'use client';

import { useEffect } from 'react';

export default function GoogleTranslate() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Define init callback expected by Google script
    (window as any).googleTranslateElementInit = () => {
        // eslint-disable-next-line new-cap
        new (window as any).google.translate.TranslateElement(
          { pageLanguage: 'en' },
          'google_translate_element'
        );
    };

    const existing = document.getElementById('google-translate-script');
    if (!existing) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    } else if ((window as any).google?.translate?.TranslateElement) {
      (window as any).googleTranslateElementInit?.();
    }
  }, []);

  return (
    <div className="flex items-center justify-center gap-3">
      <span className="text-sm text-zinc-400">Translate:</span>
      <div id="google_translate_element" className="text-black" />
    </div>
  );
}
