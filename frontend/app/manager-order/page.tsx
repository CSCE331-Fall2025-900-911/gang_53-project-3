"use client";
import React, { useEffect, useState } from "react";
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

    useEffect(() => {
        async function fetchDrinks() {
            try {
                const res = await fetch("http://localhost:8080/api/inventory");
                const data = await res.json();
                setDrinks(data);
            } catch (err) {
                console.error("Failed to fetch inventory:", err);
            }
        }
        fetchDrinks();
    }, []);

    const increment = (id: number) =>
        setQuantities((q) => ({ ...q, [id]: (q[id] || 0) + 1 }));

    const decrement = (id: number) =>
        setQuantities((q) => ({ ...q, [id]: Math.max((q[id] || 0) - 1, 0) }));

    const total = drinks.reduce(
        (sum, d) => sum + (quantities[d.inventory_id] || 0) * Number(d.price),
        0
    );

    return (
        <div className="manager-container">
            <h1 className="title">Bobalicious-53 Manager Order</h1>

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
                <button className="home-btn">Home</button>
                <div className="total">Total: ${total.toFixed(2)}</div>
                <button className="pay-btn">Payment</button>
            </div>
        </div>
    );
}