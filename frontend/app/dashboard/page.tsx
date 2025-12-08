'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useCart, type CartItem } from '@/lib/cart';
import { ProductAIChat } from '@/components/ProductAIChat';
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
  isSpecial?: boolean;
  category: Category;
};

// Database product type
type DbProduct = {
  inventory_id: number;
  name: string;
  price: number;
  category: string;
  seasonal?: string;
  quantity_on_hand?: number;
};

// Default option groups for all products
const DEFAULT_SIZE_OPTIONS: Group = {
  id: 'size',
  name: 'Size',
  type: 'single',
  options: [
    { id: 's', name: 'Small' },
    { id: 'm', name: 'Medium', priceDelta: 0.5 },
    { id: 'l', name: 'Large', priceDelta: 1.0 },
  ],
};

const DEFAULT_SUGAR_OPTIONS: Group = {
  id: 'sugar',
  name: 'Sugar Level',
  type: 'single',
  options: [
    { id: '0', name: 'No Sugar', priceDelta: 0 },
    { id: '25', name: '25%', priceDelta: 0 },
    { id: '50', name: '50%', priceDelta: 0 },
    { id: '75', name: '75%', priceDelta: 0 },
    { id: '100', name: '100%', priceDelta: 0 },
  ],
};

const DEFAULT_ICE_OPTIONS: Group = {
  id: 'ice',
  name: 'Ice Level',
  type: 'single',
  options: [
    { id: 'none', name: 'No Ice', priceDelta: 0 },
    { id: 'less', name: 'Less Ice', priceDelta: 0 },
    { id: 'normal', name: 'Regular Ice', priceDelta: 0 },
  ],
};

const DEFAULT_TEMP_OPTIONS: Group = {
  id: 'temp',
  name: 'Temperature',
  type: 'single',
  options: [
    { id: 'cold', name: 'Cold', priceDelta: 0 },
    { id: 'warm', name: 'Warm', priceDelta: 0 },
  ],
};

const CATEGORY_OPTIONS = ['All', 'Teas', 'Milk Teas', 'Smoothies', 'Coffees', 'Fruit Drinks'] as const;
type Category = (typeof CATEGORY_OPTIONS)[number];

const categorizeProduct = (name: string): Category => {
  const n = name.toLowerCase();
  const has = (kw: string | RegExp) => (typeof kw === 'string' ? n.includes(kw) : kw.test(n));

  if (has('coffee') || has('espresso') || has('americano') || has('latte')) return 'Coffees';
  if (has('smoothie') || has('slush') || has('icee') || has('frappe')) return 'Smoothies';
  if (has('milk tea') || has('milk') || has('latte')) return 'Milk Teas';

  const fruitKeywords = [
    'mango',
    'strawberry',
    'lychee',
    'passion',
    'peach',
    'grape',
    'pineapple',
    'kiwi',
    'berry',
    'watermelon',
    'melon',
    'honeydew',
    'coconut',
    'lemon',
    'lime',
    'orange',
  ];
  if (fruitKeywords.some((f) => has(f))) return 'Fruit Drinks';
  if (has('tea') || has('oolong') || has('matcha') || has('green')) return 'Teas';
  return 'All';
};

const DEFAULT_TOPPING_OPTIONS: Group = {
  id: 'toppings',
  name: 'Toppings',
  type: 'multiple',
  options: [
    { id: 'tapioca', name: 'Tapioca Pearls', priceDelta: 0.75 },
    { id: 'grass', name: 'Grass Jelly', priceDelta: 0.60 },
    { id: 'red_bean', name: 'Red Bean', priceDelta: 0.80 },
    { id: 'aloe', name: 'Aloe Vera', priceDelta: 0.70 },
    { id: 'pudding', name: 'Pudding', priceDelta: 0.85 },
    { id: 'oreo', name: 'Oreo Crumbs', priceDelta: 0.90 },
    { id: 'cheese', name: 'Cheese Foam', priceDelta: 1.00 },
    { id: 'rainbow', name: 'Rainbow Jelly', priceDelta: 0.95 },
  ],
};

// Helper function to get emoji for a product
const getDrinkEmoji = (productName: string): string => {
  const n = productName.toLowerCase();
  
  if (n.includes('coffee') || n.includes('espresso') || n.includes('latte')) return '☕';
  if (n.includes('smoothie') || n.includes('slush')) return '🥤';
  if (n.includes('matcha')) return '🍵';
  if (n.includes('milk tea') || n.includes('milk')) return '🥛';
  if (n.includes('tea')) return '🍶';
  if (n.includes('fruit') || n.includes('mango') || n.includes('strawberry') || n.includes('lychee')) return '🍓';
  if (n.includes('chocolate')) return '🍫';
  if (n.includes('honey')) return '🍯';
  
  return '🥤'; // Default emoji
};

// Helper function to convert DB product to menu item
const convertToMenuItem = (product: DbProduct): Item => ({
  id: `product-${product.inventory_id}`,
  name: product.name,
  basePrice: Number(product.price),
  description: 'Delicious bubble tea drink',
  imageUrl: '',
  optionGroups: [
    DEFAULT_SIZE_OPTIONS,
    DEFAULT_SUGAR_OPTIONS,
    DEFAULT_ICE_OPTIONS,
    DEFAULT_TEMP_OPTIONS,
    DEFAULT_TOPPING_OPTIONS,
  ],
  isSpecial: product.seasonal?.toLowerCase() === 'y',
  category: categorizeProduct(product.name),
});

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
  const [menu, setMenu] = useState<Item[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState<string | null>(null);

  // Set backend URL based on environment
  useEffect(() => {
    const url = typeof window !== 'undefined' && window.location.hostname === 'localhost'
      ? 'http://localhost:5000'
      : (process.env.NEXT_PUBLIC_API_URL || 'https://gang53-project-3-backend.vercel.app');
    setBackendURL(url.replace(/\/$/, ''));
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      if (backendURL) {
        await fetch(`${backendURL}/auth/logout`, { credentials: 'include' });
      }
    } catch {
      // ignore errors, just proceed to landing
    } finally {
      window.location.href = '/';
    }
  }, [backendURL]);

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

  // Fetch menu products from database
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setMenuLoading(true);
        const apiUrl = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_LOCAL_API_URL || 'http://localhost:5000').replace(/\/$/, '');
        
        const response = await fetch(`${apiUrl}/api/inventory`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Handle response format: { success: true, data: [...] } or just [...]
        const inventory = Array.isArray(data) ? data : data?.data || [];
        
        // Filter for products only and convert to menu items
        const products = inventory
          .filter((item: DbProduct) => item.category === 'product')
          .map((product: DbProduct) => convertToMenuItem(product));
        
        setMenu(products);
        setMenuError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setMenuError(errorMessage);
        setMenu([]);
      } finally {
        setMenuLoading(false);
      }
    };

    fetchProducts();
  }, []);

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

            {/* Right: logout */}
            <div className="flex flex-col items-start gap-3 md:items-end">
              {backendURL && user && (
                <button
                  onClick={handleLogout}
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

        {/* AI Chat Widget */}
        <section className="mb-12">
          <ProductAIChat />
        </section>

        {/* Loading and Error States */}
        {menuLoading && (
          <div className="text-center py-10">
            <p className="text-zinc-400">Loading menu...</p>
          </div>
        )}
        
        {menuError && (
          <div className="text-center py-10">
            <p className="text-red-400">Error loading menu: {menuError}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 rounded-lg border border-blue-600 bg-blue-800/50 px-4 py-2 text-sm font-medium hover:bg-blue-700/50"
            >
              Retry
            </button>
          </div>
        )}

        {/* Product row/grid (old design look) */}
        {!menuLoading && !menuError && menu.length === 0 && (
          <div className="text-center py-10">
            <p className="text-zinc-400">No products available</p>
          </div>
        )}
        
        {!menuLoading && !menuError && menu.length > 0 && (
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-[220px,1fr]">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 h-fit">
              <h3 className="mb-3 text-sm uppercase tracking-wide text-zinc-400">Categories</h3>
              <div className="flex flex-col gap-2">
                {CATEGORY_OPTIONS.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`rounded-lg px-3 py-2 text-left text-sm font-semibold transition-all border ${
                      activeCategory === cat
                        ? 'border-teal-600 bg-teal-800/50 text-white'
                        : 'border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:bg-zinc-900'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {menu
                .filter((item) => activeCategory === 'All' || item.category === activeCategory)
                .map((item: Item) => (
                  <article
                    key={item.id}
                    className={`overflow-hidden rounded-3xl border ${
                      item.isSpecial 
                        ? 'border-yellow-500 bg-yellow-900/20 shadow-lg shadow-yellow-500/20' 
                        : 'border-zinc-800 bg-zinc-900/50'
                    }`}
                  >
                    <div className="h-40 w-full bg-zinc-800/50 relative overflow-hidden flex items-center justify-center">
                      <div className="text-6xl">{getDrinkEmoji(item.name)}</div>
                      {item.isSpecial && (
                        <div className="absolute top-2 right-2 bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-bold">
                          SPECIAL
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 p-5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">{item.name}</h3>
                        <span className="text-xs text-zinc-400">{item.category}</span>
                      </div>
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
            </div>
          </section>
        )}
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
  onAdd: (line: CartItem) => void;
}) {
  const [mounted, setMounted] = useState(false);
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
      imageUrl: item.imageUrl,
    });
  };

  useEffect(() => {
    setMounted(true);
    // Set sensible defaults for single-select groups if none chosen yet
    setSelections((prev) => {
      const next = { ...prev };
      const ensureDefault = (groupId: string, defaultId: string) => {
        if (!next[groupId] || next[groupId].length === 0) {
          next[groupId] = [defaultId];
        }
      };
      ensureDefault('size', 's');
      ensureDefault('sugar', '50');
      ensureDefault('ice', 'normal');
      return next;
    });
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900">
        <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <h4 className="text-lg font-semibold text-white">Customize — {item.name}</h4>
          <button onClick={onClose} className="rounded-lg border border-zinc-700 px-3 py-1 text-white">✕</button>
        </header>

        <div className="max-h-[70vh] space-y-6 overflow-y-auto px-6 py-5">
          {item.optionGroups.map((g) => (
            <section key={g.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="font-semibold text-white">{g.name}</h5>
                <span className="text-xs text-white">
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
                        <span className="font-medium text-white">{o.name}</span>
                        {o.priceDelta !== undefined ? (
                          <span className="text-sm text-white">+${o.priceDelta.toFixed(2)}</span>
                        ) : (
                          <span className="text-sm text-white">Included</span>
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
              <span className="text-sm text-white">Qty</span>
              <div className="flex items-center rounded-xl border border-zinc-700">
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="px-3 py-2 text-white">-</button>
                <span className="px-4 text-white">{quantity}</span>
                <button onClick={() => setQuantity((q) => q + 1)} className="px-3 py-2 text-white">+</button>
              </div>
            </div>
            <div className="text-lg font-semibold text-white">${(unitPrice * quantity).toFixed(2)}</div>
          </section>
        </div>

        <footer className="flex items-center justify-end gap-3 border-t border-zinc-800 px-6 py-4">
          <button onClick={onClose} className="rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-2 text-white">Cancel</button>
          <button
            onClick={handleAdd}
            className="rounded-xl border border-teal-700 bg-teal-800/70 px-6 py-2 font-semibold text-white hover:bg-teal-700/70"
          >
            Add to Cart
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}



