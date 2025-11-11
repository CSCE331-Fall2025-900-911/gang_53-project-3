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
};

export default function ManagerOrderPage() {
    const [drinks, setDrinks] = useState<Drink[]>([]);
    const [quantities, setQuantities] = useState<{ [id: number]: number }>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        async function fetchDrinks() {
            try {
                setLoading(true);
                // Use production API URL or fall back to localhost
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_LOCAL_API_URL || "http://localhost:5000";
                console.log("Fetching from:", `${apiUrl}/api/inventory`);
                const res = await fetch(`${apiUrl}/api/inventory`);
                
                if (!res.ok) {
                    const errorData = await res.text();
                    throw new Error(`HTTP error! status: ${res.status}, body: ${errorData}`);
                }
                
                const data = await res.json();
                console.log("Received data:", data, "Type:", typeof data);
                
                // Handle response format: { success: true, data: [...] } or just [...]
                let inventory = Array.isArray(data) ? data : data?.data;
                
                if (Array.isArray(inventory)) {
                    // Filter for products only
                    const products = inventory.filter(item => item.category === 'product');
                    setDrinks(products);
                    setError(null);
                } else {
                    console.error("Data is not an array:", data);
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

    const increment = (id: number) =>
        setQuantities((q) => ({ ...q, [id]: (q[id] || 0) + 1 }));

    const decrement = (id: number) =>
        setQuantities((q) => ({ ...q, [id]: Math.max((q[id] || 0) - 1, 0) }));

    const total = Array.isArray(drinks)
        ? drinks.reduce(
            (sum, d) => sum + (quantities[d.inventory_id] || 0) * Number(d.price),
            0
          )
        : 0;

    return (
        <div className="manager-container">
            <h1 className="title">Bobalicious-53 Manager Order</h1>

            {loading && <p style={{ color: '#888', textAlign: 'center', marginTop: '20px' }}>Loading inventory...</p>}
            {error && <p style={{ color: '#ff6b6b', textAlign: 'center', marginTop: '20px' }}>Error: {error}</p>}

            {!loading && !error && drinks.length === 0 && (
                <p style={{ color: '#888', textAlign: 'center', marginTop: '20px' }}>No products available</p>
            )}

            <div className="drink-grid">
                {drinks.map((d) => (
                    <div key={d.inventory_id} className="drink-card">
                        <img
                            src="/boba-template.png"
                            alt="Boba Drink"
                            className="drink-img"
                        />
                        <h3>
                            {d.name} (${Number(d.price).toFixed(2)})
                        </h3>
                        {d.seasonal === "y" && <span className="badge">SEASONAL</span>}

                        <div className="controls">
                            <button onClick={() => decrement(d.inventory_id)}>-</button>
                            <span>{quantities[d.inventory_id] || 0}</span>
                            <button onClick={() => increment(d.inventory_id)}>+</button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="footer">
                <button className="home-btn" onClick={() => router.push("/manager-dashboard")}>Home</button>
                <div className="total">Total: ${total.toFixed(2)}</div>
                <button className="pay-btn">Payment</button>
            </div>
        </div>
    );
}