"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "./styles.css";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

type InventoryItem = {
    inventory_id: number;
    name: string;
    price: number;
    quantity_on_hand: number;
    seasonal: string;
    // category & reorder_level exist in DB, but you don't display them in the table
};

export default function InventoryPage() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [chartData, setChartData] = useState<any[]>([]);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [chartError, setChartError] = useState<string | null>(null);

    // Modal state
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showRestockModal, setShowRestockModal] = useState(false);

    // Selected item for edit/restock
    const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

    // API base URL
    const apiUrl = (
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.NEXT_PUBLIC_LOCAL_API_URL ||
        "http://localhost:5000"
    ).replace(/\/$/, "");

    // Load inventory
    useEffect(() => {
        reloadInventory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiUrl]);

    async function reloadInventory() {
        try {
            setLoading(true);
            const res = await fetch(`${apiUrl}/api/inventory`);
            if (!res.ok) {
                const body = await res.text();
                throw new Error(`HTTP ${res.status}: ${body}`);
            }

            const data = await res.json();
            const inventory = Array.isArray(data) ? data : data?.data;

            if (!Array.isArray(inventory)) {
                throw new Error("Inventory response is not an array");
            }

            setItems(inventory);
            setError(null);
        } catch (err) {
            setItems([]);
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
        }
    }

    // Usage chart
    const refreshChart = async () => {
        if (!startDate || !endDate) {
            setChartError("Please select both start and end dates");
            return;
        }

        try {
            setChartError(null);
            const res = await fetch(
                `${apiUrl}/api/usage?start=${startDate}&end=${endDate}`
            );
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }

            const data = await res.json();
            const usageData = Array.isArray(data) ? data : data?.data || [];

            if (!Array.isArray(usageData) || usageData.length === 0) {
                setChartData([]);
                setChartError("No usage data found for the selected date range");
                return;
            }

            const formatted = usageData.map((row: any) => ({
                name: `${row.product_name} (${row.order_day})`,
                usage: Number(row.total_quantity),
            }));

            setChartData(formatted);
        } catch (err) {
            setChartError(err instanceof Error ? err.message : String(err));
            setChartData([]);
        }
    };

    // ---- Handlers for modals ----

    async function handleAddItem() {
        const name = (document.getElementById("add-name") as HTMLInputElement)
            .value;
        const category = (
            document.getElementById("add-category") as HTMLSelectElement
        ).value;
        const priceStr = (document.getElementById("add-price") as HTMLInputElement)
            .value;
        const qtyStr = (document.getElementById("add-qty") as HTMLInputElement)
            .value;
        const reorderStr = (
            document.getElementById("add-reorder") as HTMLInputElement
        ).value;
        const seasonal = (
            document.getElementById("add-seasonal") as HTMLInputElement
        ).value;

        const price = Number(priceStr);
        const quantity = Number(qtyStr);
        const reorder = Number(reorderStr);

        const requestUrl = `${apiUrl}/api/inventory/add`;
        console.log('🔍 Sending POST request to:', requestUrl);
        console.log('📦 Body:', { name, category, price, quantity_on_hand: quantity, reorder_level: reorder, seasonal });

        try {
            const res = await fetch(requestUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    category, // "product" | "topping" | "disposable"
                    price,
                    quantity_on_hand: quantity,
                    reorder_level: reorder,
                    seasonal,
                }),
            });
            
            console.log('📡 Response status:', res.status);
            
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || `HTTP ${res.status}`);
            }
            
            setShowAddModal(false);
            await reloadInventory();
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            console.error("Add item failed:", errorMsg);
            alert(`Failed to add item: ${errorMsg}`);
        }
    }

    async function handleEditItem() {
        if (selectedItemId == null) {
            alert("Please select an item to change.");
            return;
        }

        const nameRaw = (document.getElementById(
            "edit-name"
        ) as HTMLInputElement).value.trim();
        const priceRaw = (document.getElementById(
            "edit-price"
        ) as HTMLInputElement).value.trim();
        const qtyRaw = (document.getElementById(
            "edit-qty"
        ) as HTMLInputElement).value.trim();
        const reorderRaw = (document.getElementById(
            "edit-reorder"
        ) as HTMLInputElement).value.trim();
        const seasonalRaw = (document.getElementById(
            "edit-seasonal"
        ) as HTMLInputElement).value.trim();

        // Match JavaFX behavior: blank = keep current (send null)
        const name = nameRaw === "" ? null : nameRaw;
        const price =
            priceRaw === "" ? null : Number.isNaN(Number(priceRaw)) ? null : Number(priceRaw);
        const quantity_on_hand =
            qtyRaw === "" ? null : Number.isNaN(Number(qtyRaw)) ? null : Number(qtyRaw);
        const reorder_level =
            reorderRaw === "" ? null : Number.isNaN(Number(reorderRaw)) ? null : Number(reorderRaw);
        const seasonal = seasonalRaw === "" ? null : seasonalRaw;

        try {
            const res = await fetch(`${apiUrl}/api/inventory/update/${selectedItemId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    price,
                    quantity_on_hand,
                    reorder_level,
                    seasonal,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || `HTTP ${res.status}`);
            }

            setShowEditModal(false);
            await reloadInventory();
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            alert(`Failed to change item: ${errorMsg}`);
            alert("Failed to change item. Check console/logs for details.");
        }
    }

    async function handleRestock() {
        if (selectedItemId == null) {
            alert("Please select an item to restock.");
            return;
        }

        const amountStr = (document.getElementById(
            "restock-amount"
        ) as HTMLInputElement).value;
        const amount = Number(amountStr);

        if (Number.isNaN(amount)) {
            alert("Please enter a valid restock amount.");
            return;
        }

        try {
            const res = await fetch(`${apiUrl}/api/inventory/restock/${selectedItemId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || `HTTP ${res.status}`);
            }

            setShowRestockModal(false);
            await reloadInventory();
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            alert(`Failed to restock item: ${errorMsg}`);
        }
    }

    const router = useRouter();

    return (
        <div className="inventory-page">
            {/* HEADER */}
            <header className="inventory-header">
                <button
                    onClick={() => router.push("/manager-dashboard")}
                    className="back-btn"
                >
                    ← Back
                </button>
                <h1>Bobalicious-53</h1>
            </header>

            {/* INVENTORY TABLE */}
            <section className="inventory-section">
                <h2>Inventory:</h2>

                {loading && (
                    <p style={{ color: "#888", marginBottom: "20px" }}>
                        Loading inventory...
                    </p>
                )}
                {error && (
                    <p style={{ color: "#ff6b6b", marginBottom: "20px" }}>
                        Error: {error}
                    </p>
                )}

                {!loading && !error && items.length === 0 && (
                    <p style={{ color: "#888", marginBottom: "20px" }}>
                        No products available
                    </p>
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

                {/* ACTION BUTTONS */}
                <div className="button-row">
                    <button
                        className="action-btn"
                        onClick={() => {
                            setShowAddModal(true);
                        }}
                    >
                        Add Item
                    </button>

                    <button
                        className="action-btn"
                        onClick={() => {
                            if (items.length > 0) {
                                setSelectedItemId(items[0].inventory_id);
                            }
                            setShowEditModal(true);
                        }}
                    >
                        Change Item
                    </button>

                    <button
                        className="action-btn"
                        onClick={() => {
                            if (items.length > 0) {
                                setSelectedItemId(items[0].inventory_id);
                            }
                            setShowRestockModal(true);
                        }}
                    >
                        Restock
                    </button>
                </div>
            </section>

            {/* ADD ITEM MODAL */}
            {showAddModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>Add Item</h3>

                        <input id="add-name" placeholder="Name" />

                        <select id="add-category" defaultValue="product">
                            <option value="product">product</option>
                            <option value="topping">topping</option>
                            <option value="disposable">disposable</option>
                        </select>

                        <input
                            id="add-price"
                            placeholder="Price (e.g., 4.50)"
                            type="number"
                            step="0.01"
                        />
                        <input
                            id="add-qty"
                            placeholder="Quantity on hand"
                            type="number"
                        />
                        <input
                            id="add-reorder"
                            placeholder="Reorder level"
                            type="number"
                        />
                        <input
                            id="add-seasonal"
                            placeholder="Seasonal? (y/n)"
                        />

                        <button onClick={handleAddItem}>Submit</button>
                        <button onClick={() => setShowAddModal(false)}>Cancel</button>
                    </div>
                </div>
            )}

            {/* CHANGE ITEM MODAL */}
            {showEditModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>Change Item</h3>

                        <select
                            value={selectedItemId ?? ""}
                            onChange={(e) =>
                                setSelectedItemId(
                                    e.target.value === ""
                                        ? null
                                        : Number(e.target.value)
                                )
                            }
                        >
                            <option value="">Select item</option>
                            {items.map((item) => (
                                <option
                                    key={item.inventory_id}
                                    value={item.inventory_id}
                                >
                                    {item.inventory_id} — {item.name}
                                </option>
                            ))}
                        </select>

                        <input
                            id="edit-name"
                            placeholder="New name (leave blank to keep)"
                        />
                        <input
                            id="edit-price"
                            placeholder="New price (blank = keep)"
                            type="number"
                            step="0.01"
                        />
                        <input
                            id="edit-qty"
                            placeholder="New quantity (blank = keep)"
                            type="number"
                        />
                        <input
                            id="edit-reorder"
                            placeholder="New reorder level (blank = keep)"
                            type="number"
                        />
                        <input
                            id="edit-seasonal"
                            placeholder="New seasonal (blank = keep)"
                        />

                        <button onClick={handleEditItem}>Save</button>
                        <button onClick={() => setShowEditModal(false)}>Cancel</button>
                    </div>
                </div>
            )}

            {/* RESTOCK MODAL */}
            {showRestockModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>Restock Item</h3>

                        <select
                            value={selectedItemId ?? ""}
                            onChange={(e) =>
                                setSelectedItemId(
                                    e.target.value === ""
                                        ? null
                                        : Number(e.target.value)
                                )
                            }
                        >
                            <option value="">Select item</option>
                            {items.map((item) => (
                                <option
                                    key={item.inventory_id}
                                    value={item.inventory_id}
                                >
                                    {item.inventory_id} — {item.name}
                                </option>
                            ))}
                        </select>

                        <input
                            id="restock-amount"
                            placeholder="Amount to add"
                            type="number"
                        />

                        <button onClick={handleRestock}>Submit</button>
                        <button onClick={() => setShowRestockModal(false)}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* USAGE CHART */}
            <section className="chart-section">
                <h2>Product Usage Chart</h2>

                {chartError && (
                    <p style={{ color: "#ff6b6b", marginBottom: "20px" }}>
                        Error: {chartError}
                    </p>
                )}

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
                        <ResponsiveContainer
                            width={chartData.length * 50}
                            height={300}
                        >
                            <LineChart
                                data={chartData}
                                margin={{
                                    top: 10,
                                    right: 40,
                                    left: 0,
                                    bottom: 10,
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="name"
                                    angle={-45}
                                    textAnchor="end"
                                    height={100}
                                    interval={0}
                                />
                                <YAxis />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey="usage"
                                    stroke="#ff7300"
                                    dot={{ r: 3 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </section>
        </div>
    );
}