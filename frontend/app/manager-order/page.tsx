"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "./styles.css";

type Drink = {
    inventory_id: number;
    name: string;
    price: number;
    category: string;
    seasonal: string;
    drinkCategory?: string;
};

type CartItem = {
    id: number;
    name: string;
    price: number;
    quantity: number;
    size: string;
    iceLevel?: string;
    sugarLevel?: string;
    temperature?: string;
    toppings: Topping[];
};

type Topping = {
    id: string;
    name: string;
    price: number;
};

const DRINK_CATEGORIES = ['All', 'Teas', 'Milk Teas', 'Smoothies', 'Coffees', 'Fruit Drinks'];

const SIZES = [
    { id: 's', name: 'Small', priceDelta: 0 },
    { id: 'm', name: 'Medium', priceDelta: 0.5 },
    { id: 'l', name: 'Large', priceDelta: 1.0 },
];

const ICE_LEVELS = ['0% Ice', '25% Ice', '50% Ice', '75% Ice', '100% Ice'];

const SUGAR_LEVELS = ['0%', '25%', '50%', '75%', '100%', 'More'];

const TEMPERATURES = ['Hot', 'Cold'];

const TOPPINGS: Topping[] = [
    { id: 'tapioca', name: 'Tapioca Pearls', price: 0.75 },
    { id: 'grass', name: 'Grass Jelly', price: 0.60 },
    { id: 'red_bean', name: 'Red Bean', price: 0.80 },
    { id: 'aloe', name: 'Aloe Vera', price: 0.70 },
    { id: 'pudding', name: 'Pudding', price: 0.85 },
    { id: 'oreo', name: 'Oreo Crumbs', price: 0.90 },
    { id: 'cheese', name: 'Cheese Foam', price: 1.00 },
    { id: 'rainbow', name: 'Rainbow Jelly', price: 0.95 },
];

// Helper function to determine drink type
const getDrinkType = (name: string): 'tea' | 'coffee' | 'smoothie' | 'fruit' => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('coffee') || lowerName.includes('cappuccino') || lowerName.includes('latte') || lowerName.includes('mocha') || lowerName.includes('espresso') || lowerName.includes('americano')) return 'coffee';
    if (lowerName.includes('smoothie')) return 'smoothie';
    if (lowerName.includes('juice')) return 'fruit';
    return 'tea';
};

// Helper function to check if drink needs temperature option
const needsTemperatureOption = (type: 'tea' | 'coffee' | 'smoothie' | 'fruit'): boolean => {
    return type === 'coffee';
};

export default function ManagerOrderPage() {
    const [drinks, setDrinks] = useState<Drink[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedDrink, setSelectedDrink] = useState<Drink | null>(null);
    const [drinkType, setDrinkType] = useState<'tea' | 'coffee' | 'smoothie' | 'fruit'>('tea');
    const [selectedSize, setSelectedSize] = useState('s');
    const [selectedIce, setSelectedIce] = useState('50% Ice');
    const [selectedSugar, setSelectedSugar] = useState('100%');
    const [selectedTemperature, setSelectedTemperature] = useState('Cold');
    const [selectedToppings, setSelectedToppings] = useState<Topping[]>([]);
    const [showModal, setShowModal] = useState(false);
    const router = useRouter();

    useEffect(() => {
        async function fetchDrinks() {
            try {
                setLoading(true);
                const apiUrl = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_LOCAL_API_URL || "http://localhost:5000").replace(/\/$/, '');
                const res = await fetch(`${apiUrl}/api/inventory`);
                
                if (!res.ok) {
                    const errorData = await res.text();
                    throw new Error(`HTTP error! status: ${res.status}, body: ${errorData}`);
                }
                
                const data = await res.json();
                let inventory = Array.isArray(data) ? data : data?.data;
                
                if (Array.isArray(inventory)) {
                    const products = inventory.filter(item => item.category === 'product');
                    setDrinks(products);
                    setError(null);
                } else {
                    throw new Error(`API returned non-array data: ${JSON.stringify(data)}`);
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : String(err);
                console.error("Failed to fetch inventory:", errorMessage);
                setError(errorMessage);
                setDrinks([]);
            } finally {
                setLoading(false);
            }
        }
        fetchDrinks();
    }, []);

    const categorizeProduct = (name: string): string => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('smoothie')) return 'Smoothies';
        if (lowerName.includes('coffee') || lowerName.includes('cappuccino') || lowerName.includes('latte')) return 'Coffees';
        if (lowerName.includes('milk tea')) return 'Milk Teas';
        if (lowerName.includes('fruit') || lowerName.includes('mango') || lowerName.includes('strawberry') || lowerName.includes('lychee')) return 'Fruit Drinks';
        if (lowerName.includes('tea') || lowerName.includes('matcha') || lowerName.includes('jasmine')) return 'Teas';
        return 'Other';
    };

    const filteredDrinks = selectedCategory === 'All'
        ? drinks
        : drinks.filter(d => categorizeProduct(d.name) === selectedCategory);

    const addToCart = (drink: Drink) => {
        setSelectedDrink(drink);
        const type = getDrinkType(drink.name);
        setDrinkType(type);
        if (type !== 'tea') {
            setSelectedTemperature('Cold');
        }
        setShowModal(true);
    };

    const confirmAddToCart = () => {
        if (!selectedDrink) return;
        
        const isTea = drinkType === 'tea';
        const selectedSizeObj = SIZES.find(s => s.id === selectedSize);
        const sizePriceDelta = selectedSizeObj?.priceDelta || 0;
        const finalPrice = selectedDrink.price + sizePriceDelta;

        const baseProps = {
            id: selectedDrink.inventory_id,
            name: selectedDrink.name,
            price: finalPrice,
            quantity: 1,
            size: selectedSize,
            toppings: selectedToppings,
        };

        const newItem: CartItem = isTea
            ? {
                ...baseProps,
                iceLevel: selectedIce,
                sugarLevel: selectedSugar,
            }
            : {
                ...baseProps,
                temperature: drinkType === 'coffee' ? selectedTemperature : 'Cold',
            };

        const existingItem = cart.find(item =>
            item.id === selectedDrink.inventory_id &&
            item.size === selectedSize &&
            (isTea
                ? item.iceLevel === selectedIce && item.sugarLevel === selectedSugar
                : item.temperature === (drinkType === 'coffee' ? selectedTemperature : 'Cold')) &&
            JSON.stringify(item.toppings.map(t => t.id).sort()) === JSON.stringify(selectedToppings.map(t => t.id).sort())
        );

        if (existingItem) {
            setCart(cart.map(item =>
                item === existingItem ? { ...item, quantity: item.quantity + 1 } : item
            ));
        } else {
            setCart([...cart, newItem]);
        }
        setShowModal(false);
        setSelectedDrink(null);
        setSelectedToppings([]);
    };

    const removeFromCart = (item: CartItem) => {
        setCart(cart.filter(cartItem => cartItem !== item));
    };

    const updateQuantity = (item: CartItem, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(item);
        } else {
            setCart(cart.map(cartItem =>
                cartItem === item ? { ...cartItem, quantity } : cartItem
            ));
        }
    };

    const total = cart.reduce((sum, item) => {
        const basePrice = Number(item.price) || 0;
        const toppingPrice = item.toppings.reduce((tSum, topping) => tSum + (topping.price || 0), 0);
        return sum + (basePrice + toppingPrice) * item.quantity;
    }, 0);

    // Calculate current modal price based on selections
    const getModalPrice = () => {
        if (!selectedDrink) return 0;
        const selectedSizeObj = SIZES.find(s => s.id === selectedSize);
        const sizePriceDelta = selectedSizeObj?.priceDelta || 0;
        const basePriceWithSize = selectedDrink.price + sizePriceDelta;
        const toppingPrice = selectedToppings.reduce((sum, t) => sum + t.price, 0);
        return basePriceWithSize + toppingPrice;
    };

    return (
        <div className="manager-order-container">
            <h1 className="manager-order-title">Bobalicious Manager Order</h1>

            {loading && <p className="loading-text">Loading inventory...</p>}
            {error && <p className="error-text">Error: {error}</p>}

            {!loading && !error && (
                <div className="manager-order-layout">
                    {/* Sidebar with Categories */}
                    <div className="manager-order-sidebar">
                        <h3>Categories</h3>
                        {DRINK_CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
                                onClick={() => setSelectedCategory(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Main Content Area */}
                    <div className="manager-order-main">
                        {/* Drinks Grid */}
                        <div className="manager-drinks-grid">
                            {filteredDrinks.length > 0 ? (
                                filteredDrinks.map((d) => (
                                    <div key={d.inventory_id} className="manager-drink-card">
                                        <img
                                            src="/boba-template.png"
                                            alt={d.name}
                                            className="manager-drink-img"
                                        />
                                        <h3>{d.name}</h3>
                                        <p className="drink-price">${Number(d.price).toFixed(2)}</p>
                                        {d.seasonal === "y" && <span className="seasonal-badge">SEASONAL</span>}
                                        <button
                                            className="add-drink-btn"
                                            onClick={() => addToCart(d)}
                                        >
                                            Add to Order
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className="no-drinks-text">No drinks in this category</p>
                            )}
                        </div>

                        {/* Cart Section */}
                        <div className="manager-cart-section">
                            <h2>Order Summary</h2>
                            {cart.length > 0 ? (
                                <div className="cart-items">
                                    {cart.map((item, idx) => (
                                        <div key={idx} className="cart-item">
                                            <div className="cart-item-details">
                                                <p className="cart-item-name">{item.name}</p>
                                                <p className="cart-item-options">
                                                    {SIZES.find(s => s.id === item.size)?.name} •
                                                    {item.iceLevel ? (
                                                        <>
                                                            {item.iceLevel} • {item.sugarLevel} Sugar
                                                        </>
                                                    ) : (
                                                        <>
                                                            {item.temperature}
                                                        </>
                                                    )}
                                                    {item.toppings.length > 0 && (
                                                        <>
                                                            <br />
                                                            <span className="toppings-list">{item.toppings.map(t => t.name).join(', ')}</span>
                                                        </>
                                                    )}
                                                </p>
                                            </div>
                                            <div className="cart-item-controls">
                                                <button onClick={() => updateQuantity(item, item.quantity - 1)}>-</button>
                                                <span>{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item, item.quantity + 1)}>+</button>
                                            </div>
                                            <p className="cart-item-price">${((item.price + item.toppings.reduce((sum, t) => sum + t.price, 0)) * item.quantity).toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="empty-cart-text">No items in cart</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal for Customization */}
            {showModal && selectedDrink && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>{selectedDrink.name}</h2>
                        <p className="modal-price">${Number(getModalPrice()).toFixed(2)}</p>

                        <div className="modal-section">
                            <label>Size:</label>
                            <div className="option-buttons">
                                {SIZES.map(size => (
                                    <button
                                        key={size.id}
                                        className={`option-btn ${selectedSize === size.id ? 'selected' : ''}`}
                                        onClick={() => setSelectedSize(size.id)}
                                    >
                                        {size.name}
                                        {size.priceDelta > 0 && <span className="size-price">+${size.priceDelta.toFixed(2)}</span>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {drinkType === 'tea' ? (
                            <>
                                <div className="modal-section">
                                    <label>Ice Level:</label>
                                    <div className="option-buttons">
                                        {ICE_LEVELS.map(ice => (
                                            <button
                                                key={ice}
                                                className={`option-btn ${selectedIce === ice ? 'selected' : ''}`}
                                                onClick={() => setSelectedIce(ice)}
                                            >
                                                {ice}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="modal-section">
                                    <label>Sugar Level:</label>
                                    <div className="option-buttons">
                                        {SUGAR_LEVELS.map(sugar => (
                                            <button
                                                key={sugar}
                                                className={`option-btn ${selectedSugar === sugar ? 'selected' : ''}`}
                                                onClick={() => setSelectedSugar(sugar)}
                                            >
                                                {sugar}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : drinkType === 'coffee' ? (
                            <div className="modal-section">
                                <label>Temperature:</label>
                                <div className="option-buttons">
                                    {TEMPERATURES.map(temp => (
                                        <button
                                            key={temp}
                                            className={`option-btn ${selectedTemperature === temp ? 'selected' : ''}`}
                                            onClick={() => setSelectedTemperature(temp)}
                                        >
                                            {temp}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        <div className="modal-section">
                            <label>Toppings (Select any):</label>
                            <div className="toppings-grid">
                                {TOPPINGS.map(topping => (
                                    <button
                                        key={topping.id}
                                        className={`topping-btn ${selectedToppings.some(t => t.id === topping.id) ? 'selected' : ''}`}
                                        onClick={() => {
                                            if (selectedToppings.some(t => t.id === topping.id)) {
                                                setSelectedToppings(selectedToppings.filter(t => t.id !== topping.id));
                                            } else {
                                                setSelectedToppings([...selectedToppings, topping]);
                                            }
                                        }}
                                    >
                                        {topping.name}
                                        <br />
                                        <span className="topping-price">+${topping.price.toFixed(2)}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="modal-buttons">
                            <button className="modal-cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="modal-confirm-btn" onClick={confirmAddToCart}>Add to Order</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="manager-footer">
                <button className="manager-home-btn" onClick={() => router.push("/manager-dashboard")}>Home</button>
                <div className="manager-total">Total: ${total.toFixed(2)}</div>
                <button className="manager-pay-btn">Payment</button>
            </div>
        </div>
    );
}