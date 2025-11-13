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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [chartError, setChartError] = useState<string | null>(null);

    // Use production API URL or fall back to localhost
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_LOCAL_API_URL || "http://localhost:5000";

    // Fetch inventory from backend
    useEffect(() => {
        async function fetchInventory() {
            try {
                setLoading(true);
                console.log("Fetching inventory from:", `${apiUrl}/api/inventory`);
                const res = await fetch(`${apiUrl}/api/inventory`);
                
                if (!res.ok) {
                    const errorData = await res.text();
                    throw new Error(`HTTP error! status: ${res.status}, body: ${errorData}`);
                }
                
                const data = await res.json();
                console.log("Received inventory data:", data);
                
                // Handle response format: { success: true, data: [...] } or just [...]
                let inventory = Array.isArray(data) ? data : data?.data;
                
                if (Array.isArray(inventory)) {
                    setItems(inventory);
                    setError(null);
                } else {
                    console.error("Data is not an array:", data);
                    throw new Error(`API returned non-array data: ${JSON.stringify(data)}`);
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : String(err);
                console.error("Error fetching inventory:", errorMessage);
                setError(errorMessage);
                setItems([]);
            } finally {
                setLoading(false);
            }
        }
        fetchInventory();
    }, [apiUrl]);

    const refreshChart = async () => {
        if (!startDate || !endDate) {
            setChartError("Please select both start and end dates");
            return;
        }

        try {
            setChartError(null);
            const normalizedUrl = apiUrl.replace(/\/$/, '');
            console.log("Fetching usage data from:", `${normalizedUrl}/api/usage?start=${startDate}&end=${endDate}`);
            const response = await fetch(
                `${normalizedUrl}/api/usage?start=${startDate}&end=${endDate}`
            );
            
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            
            const data = await res.json();
            console.log("Received usage data:", data);
            
            // Handle wrapped response format
            let usageData = Array.isArray(data) ? data : data?.data || [];
            
            if (!Array.isArray(usageData)) {
                console.error("Usage data is not an array:", usageData);
                setChartData([]);
                setChartError("Invalid data format received from server");
                return;
            }

            if (usageData.length === 0) {
                setChartData([]);
                setChartError("No usage data found for the selected date range");
                return;
            }

            // Convert to recharts-friendly format
            const formatted = usageData.map((row: any) => ({
                name: `${row.product_name} (${row.order_day})`,
                usage: Number(row.total_quantity),
            }));

            setChartData(formatted);
            setChartError(null);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            console.error("Error fetching usage chart data:", errorMessage);
            setChartData([]);
            setChartError(errorMessage);
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
                
                {loading && <p style={{ color: '#888', marginBottom: '20px' }}>Loading inventory...</p>}
                {error && <p style={{ color: '#ff6b6b', marginBottom: '20px' }}>Error: {error}</p>}
                
                {!loading && !error && items.length === 0 && (
                    <p style={{ color: '#888', marginBottom: '20px' }}>No products available</p>
                )}
                
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

                {chartError && <p style={{ color: '#ff6b6b', marginBottom: '20px' }}>Error: {chartError}</p>}

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
