'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/cart';
import './styles.css';

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

type Opt = { id: string; name: string; priceDelta?: number };
type Group = { id: string; name: string; type: 'single' | 'multiple'; options: Opt[] };
type Item = {
  id: string;
  name: string;
  basePrice: number;
  description?: string;
  imageUrl?: string;
  optionGroups: Group[];
};

const MENU: Item[] = [
  {
    id: 'oolong-milk-tea',
    name: 'Oolong Milk Tea',
    basePrice: 4.75,
    description: 'Toasty oolong with milk.',
    imageUrl: '',
    optionGroups: [
      {
        id: 'size',
        name: 'Size',
        type: 'single',
        options: [
          { id: 's', name: 'Small' },
          { id: 'm', name: 'Medium', priceDelta: 0.5 },
          { id: 'l', name: 'Large', priceDelta: 1.0 },
        ],
      },
      {
        id: 'toppings',
        name: 'Toppings',
        type: 'multiple',
        options: [
          { id: 'boba', name: 'Boba', priceDelta: 0.5 },
          { id: 'grass', name: 'Grass Jelly', priceDelta: 0.5 },
          { id: 'pudding', name: 'Egg Pudding', priceDelta: 0.75 },
        ],
      },
    ],
  },
  {
    id: 'thai-tea',
    name: 'Thai Tea',
    basePrice: 4.95,
    description: 'Classic, creamy Thai tea.',
    imageUrl: '',
    optionGroups: [
      {
        id: 'size',
        name: 'Size',
        type: 'single',
        options: [
          { id: 's', name: 'Small' },
          { id: 'm', name: 'Medium', priceDelta: 0.5 },
          { id: 'l', name: 'Large', priceDelta: 1.0 },
        ],
      },
      {
        id: 'toppings',
        name: 'Toppings',
        type: 'multiple',
        options: [
          { id: 'boba', name: 'Boba', priceDelta: 0.5 },
          { id: 'lychee', name: 'Lychee Jelly', priceDelta: 0.5 },
        ],
      },
    ],
  },
  {
    id: 'strawberry-milk',
    name: 'Strawberry Fresh Milk',
    basePrice: 5.25,
    description: 'Fresh milk with real strawberry.',
    imageUrl: '',
    optionGroups: [
      {
        id: 'size',
        name: 'Size',
        type: 'single',
        options: [
          { id: 's', name: 'Small' },
          { id: 'm', name: 'Medium', priceDelta: 0.5 },
          { id: 'l', name: 'Large', priceDelta: 1.0 },
        ],
      },
      {
        id: 'toppings',
        name: 'Toppings',
        type: 'multiple',
        options: [
          { id: 'boba', name: 'Boba', priceDelta: 0.5 },
          { id: 'straw', name: 'Strawberry Popping', priceDelta: 0.6 },
        ],
      },
    ],
  },
];

// ----- helper to compute a stable line id from selections -----
const lineId = (itemId: string, selections: Record<string, string[]>, sizeId?: string) =>
  `${itemId}:${sizeId ?? ''}:${Object.entries(selections)
    .map(([g, arr]) => `${g}=${arr.slice().sort().join('|')}`)
    .sort()
    .join(';')}`;

export default function OldDesignMenuPage() {
  const { add, subtotal } = useCart();
  const [active, setActive] = useState<Item | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [backendURL, setBackendURL] = useState('');
  const [loading, setLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [highContrast, setHighContrast] = useState(false);

  // Initialize translate widget
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).googleTranslateElementInit = function() {
        new (window as any).google.translate.TranslateElement(
          { pageLanguage: 'en' },
          'google_translate_element'
        );
      };

      const script = document.createElement('script');
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Set backend URL based on environment
  useEffect(() => {
    const url = typeof window !== 'undefined' && window.location.hostname === 'localhost'
      ? 'http://localhost:5000'
      : (process.env.NEXT_PUBLIC_API_URL || 'https://gang53-project-3-backend.vercel.app');
    setBackendURL(url.replace(/\/$/, ''));
  }, []);

  // Fetch user and weather data
  useEffect(() => {
    if (!backendURL) return;
    
    // Fetch user auth status
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
            id: userData.id || userData._json?.sub || 0,
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

  return (
    <main
      className={`min-h-dvh bg-gradient-to-b from-zinc-900 via-zinc-950 to-black text-zinc-100 ${
        highContrast ? 'high-contrast-mode' : ''
      }`}
      style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center top' }}
    >
      {/* Accessibility Controls */}
      <div className="flex gap-2 flex-wrap p-4 bg-zinc-800/30 border-b border-zinc-700">
        <button
          onClick={() => setZoomLevel((prev) => Math.min(prev + 0.2, 2))}
          className="rounded-lg border border-blue-600 bg-blue-800/50 px-3 py-2 text-sm font-medium hover:bg-blue-700/50 transition-colors"
          title="Zoom in for better visibility"
        >
          🔍 Zoom In
        </button>
        <button
          onClick={() => setZoomLevel(1)}
          className="rounded-lg border border-blue-600 bg-blue-800/50 px-3 py-2 text-sm font-medium hover:bg-blue-700/50 transition-colors"
          title="Reset zoom to normal size"
        >
          ↺ Reset Zoom
        </button>
        <button
          onClick={() => setHighContrast((prev) => !prev)}
          className="rounded-lg border border-blue-600 bg-blue-800/50 px-3 py-2 text-sm font-medium hover:bg-blue-700/50 transition-colors"
          title="Toggle high contrast for better readability"
        >
          {highContrast ? '◐ Normal Colors' : '◑ High Contrast'}
        </button>
      </div>

      {/* Top header with user info, weather, and translate */}
      <div className="border-b border-zinc-800 bg-zinc-900/70 px-6 py-4">
     <div className="mx-auto w-full max-w-6xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Left: User greeting and weather */}
            <div className="space-y-2">
              {user && (
                <div>
                  <h2 className="text-2xl font-bold">Welcome, {user.name}!</h2>
                  <p className="text-sm text-zinc-400">{user.email}</p>
                </div>
              )}
              {weather && (
                <div className="text-sm text-zinc-300">
                  🌤️ {weather.city}: {weather.temperature}°C, {weather.description}
                </div>
              )}
            </div>

            {/* Right: Translate and logout */}
            <div className="flex flex-col items-start gap-3 md:items-end">
              <div id="google_translate_element"></div>
              {backendURL && user && (
                <button
                  onClick={() => {
                    window.location.href = `${backendURL}/auth/logout`;
                  }}
                  className="rounded-lg border border-red-700 bg-red-900/40 px-4 py-2 text-sm font-medium hover:bg-red-900/60"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main menu content */}
      <div className="mx-auto w-full max-w-6xl px-6 py-10 md:py-16">
        {/* Title */}
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Bobalicious</h1>
          <p className="mt-2 text-zinc-400">Pick a drink to customize</p>
        </header>

        {/* Product row/grid (old design look) */}
        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {MENU.map((item) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/50"
            >
              <div className="h-40 w-full bg-zinc-800/50" />
              <div className="space-y-2 p-5">
                <h3 className="text-lg font-semibold">{item.name}</h3>
                <p className="text-sm text-zinc-400 line-clamp-2">{item.description}</p>
                <div className="flex items-center justify-between pt-2">
                  <span className="font-semibold">${item.basePrice.toFixed(2)}</span>
                  <button
                    onClick={() => setActive(item)}
                    className="rounded-xl border border-teal-700 bg-teal-800/70 px-4 py-2 text-sm font-semibold transition-all hover:bg-teal-700/70"
                  >
                    Customize
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>

        {/* Summary + Go to Cart (bottom-right) */}
        <div className="mt-10 flex items-center justify-end gap-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-5 py-3 text-lg font-semibold">
            Total: ${subtotal.toFixed(2)}
          </div>
          <Link
            href="/cart"
            className="rounded-xl border border-indigo-700 bg-indigo-800/70 px-6 py-3 font-semibold hover:bg-indigo-700/70"
          >
            Go to Cart
          </Link>
        </div>
      </div>

      {/* Inline customize modal */}
      {active && (
        <CustomizeModal
          item={active}
          onClose={() => setActive(null)}
          onAdd={(line) => {
            add(line);
            setActive(null);
          }}
        />
      )}
    </main>
  );
}

function CustomizeModal({
  item,
  onClose,
  onAdd,
}: {
  item: Item;
  onClose: () => void;
  onAdd: (line: {
    id: string;
    itemId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    selections: Record<string, string[]>;
  }) => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const sizeGroup = item.optionGroups.find((g) => g.id === 'size');

  const currentSizeId = selections['size']?.[0];
  const unitPrice = useMemo(() => {
    let p = item.basePrice;
    for (const g of item.optionGroups) {
      const chosen = selections[g.id] ?? [];
      for (const opt of g.options) {
        if (g.type === 'single') {
          if (chosen[0] === opt.id) p += opt.priceDelta ?? 0;
        } else {
          if (chosen.includes(opt.id)) p += opt.priceDelta ?? 0;
        }
      }
    }
    return p;
  }, [item, selections]);

  const toggle = (group: Group, opt: Opt) => {
    setSelections((prev) => {
      const cur = prev[group.id] ?? [];
      if (group.type === 'single') return { ...prev, [group.id]: [opt.id] };
      const exists = cur.includes(opt.id);
      return { ...prev, [group.id]: exists ? cur.filter((x) => x !== opt.id) : [...cur, opt.id] };
    });
  };

  const handleAdd = () => {
    const id = lineId(item.id, selections, currentSizeId);
    onAdd({
      id,
      itemId: item.id,
      name: item.name,
      quantity,
      unitPrice,
      totalPrice: unitPrice * quantity,
      selections,
    });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900">
        <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <h4 className="text-lg font-semibold">Customize — {item.name}</h4>
          <button onClick={onClose} className="rounded-lg border border-zinc-700 px-3 py-1">✕</button>
        </header>

        <div className="max-h-[70vh] space-y-6 overflow-y-auto px-6 py-5">
          {item.optionGroups.map((g) => (
            <section key={g.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="font-semibold">{g.name}</h5>
                <span className="text-xs text-zinc-400">
                  {g.type === 'single' ? 'Choose 1' : 'Choose any'}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {g.options.map((o) => {
                  const chosen = (selections[g.id] ?? []).includes(o.id);
                  return (
                    <button
                      key={o.id}
                      onClick={() => toggle(g, o)}
                      className={`rounded-xl border px-4 py-3 text-left transition-all ${
                        chosen
                          ? 'border-teal-600 bg-teal-900/40'
                          : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{o.name}</span>
                        {o.priceDelta ? (
                          <span className="text-sm text-zinc-300">+${o.priceDelta.toFixed(2)}</span>
                        ) : (
                          <span className="text-sm text-zinc-500">Included</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}

          <section className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-400">Qty</span>
              <div className="flex items-center rounded-xl border border-zinc-700">
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="px-3 py-2">-</button>
                <span className="px-4">{quantity}</span>
                <button onClick={() => setQuantity((q) => q + 1)} className="px-3 py-2">+</button>
              </div>
            </div>
            <div className="text-lg font-semibold">${(unitPrice * quantity).toFixed(2)}</div>
          </section>
        </div>

        <footer className="flex items-center justify-end gap-3 border-t border-zinc-800 px-6 py-4">
          <button onClick={onClose} className="rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-2">Cancel</button>
          <button
            onClick={handleAdd}
            className="rounded-xl border border-teal-700 bg-teal-800/70 px-6 py-2 font-semibold hover:bg-teal-700/70"
          >
            Add to Cart
          </button>
        </footer>
      </div>
    </div>
  );
}
