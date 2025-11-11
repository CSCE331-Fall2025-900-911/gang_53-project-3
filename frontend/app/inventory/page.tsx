"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "./styles.css";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type InventoryItem = {
    inventory_id: number;
    name: string;
    price: number;
    quantity_on_hand: number;
    seasonal: string;
};

export default function InventoryPage() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [chartData, setChartData] = useState<any[]>([]);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Fetch inventory from backend
    useEffect(() => {
        async function fetchInventory() {
            try {
                const res = await fetch("http://localhost:8080/api/inventory");
                const data = await res.json();
                setItems(data);
            } catch (err) {
                console.error("Error fetching inventory:", err);
            }
        }
        fetchInventory();
    }, []);

    const refreshChart = async () => {
        if (!startDate || !endDate) return;

        try {
            const res = await fetch(
                `http://localhost:8080/api/usage?start=${startDate}&end=${endDate}`
            );
            const data = await res.json();

            // Convert to recharts-friendly format
            const formatted = data.map((row: any) => ({
                name: `${row.product_name} (${row.order_day})`,
                usage: Number(row.total_quantity),
            }));

            setChartData(formatted);
        } catch (err) {
            console.error("Error fetching usage chart data:", err);
        }
    };

    const router = useRouter();

    return (
        <div className="inventory-page">
            <header className="inventory-header">
                <button onClick={() => router.push("/manager-dashboard")} className="back-btn">← Back</button>
                <h1>Bobalicious-53</h1>
            </header>

            <section className="inventory-section">
                <h2>Inventory:</h2>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Price</th>
                                <th>Quantity On Hand</th>
                                <th>Seasonal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.inventory_id}>
                                    <td>{item.inventory_id}</td>
                                    <td>{item.name}</td>
                                    <td>${Number(item.price).toFixed(2)}</td>
                                    <td>{item.quantity_on_hand}</td>
                                    <td>{item.seasonal}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="button-row">
                    <button className="action-btn">Add Item</button>
                    <button className="action-btn">Change Item</button>
                    <button className="action-btn">Restock</button>
                </div>
            </section>

            <section className="chart-section">
                <h2>Product Usage Chart</h2>

                <div className="date-controls">
                    <label>
                        Start Date:
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </label>
                    <label>
                        End Date:
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </label>
                    <button className="refresh-btn" onClick={refreshChart}>
                        Refresh Chart
                    </button>
                </div>

                <div className="chart-scroll">
                    <div className="chart-inner">
                        <ResponsiveContainer width={chartData.length * 50} height={300}>
                            <LineChart data={chartData} margin={{ top: 10, right: 40, left: 0, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} interval={0} />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="usage" stroke="#ff7300" dot={{ r: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </section>
        </div>
    );
}
