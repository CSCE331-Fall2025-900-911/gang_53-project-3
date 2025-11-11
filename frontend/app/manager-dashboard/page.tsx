"use client";
import React from "react";
import { useRouter } from "next/navigation";
import "./styles.css";

export default function DashboardPage() {
    const router = useRouter();
    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <h1>Bobalicious-53</h1>
                <div className="account-info">
                    <p>Currently logged in as: <strong>Joe Biden</strong></p>
                    <p>Account type: <strong>Manager</strong></p>
                </div>
            </header>

            <main className="dashboard-main">
                <button onClick={() => router.push("/manager-order")} className="btn">Manager Order</button>
                <button onClick={() => router.push("/inventory")} className="btn">Inventory</button>
                <button onClick={() => router.push("/manager-actions")} className="btn">Ordering Trends</button>
            </main>

            <footer className="dashboard-footer">
                <button onClick={() => router.push("/login")} className="btn">Logout</button>
            </footer>
        </div>
    );
}
