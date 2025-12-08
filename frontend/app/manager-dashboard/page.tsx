"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "./styles.css";

interface Employee {
  employee_id: number;
  name: string;
  role: string;
  username: string;
}

export default function DashboardPage() {
    const router = useRouter();
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      // Check if employee is logged in
      const employeeData = sessionStorage.getItem('employee');
      
      if (!employeeData) {
        // Not logged in, redirect to login
        router.push('/employee-login');
        return;
      }

      try {
        const parsedEmployee = JSON.parse(employeeData);
        setEmployee(parsedEmployee);
        setLoading(false);
      } catch (error) {
        // Invalid data, redirect to login
        sessionStorage.removeItem('employee');
        router.push('/employee-login');
      }
    }, [router]);

    const handleLogout = () => {
      sessionStorage.removeItem('employee');
      router.push('/employee-login');
    };

    if (loading) {
      return (
        <div className="dashboard-container">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p className="dashboard-loading">Loading...</p>
          </div>
        </div>
      );
    }

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="header-left">
                    <h1 className="dashboard-title">Bobalicious Manager</h1>
                    <div className="account-info">
                        <p>Welcome, <strong>{employee?.name || 'Unknown'}</strong></p>
                        <p className="role-badge">{employee?.role || 'Unknown'}</p>
                    </div>
                </div>
                <button onClick={handleLogout} className="logout-btn">Logout</button>
            </header>

            <main className="dashboard-main">
                <div className="dashboard-grid">
                    <button 
                        onClick={() => router.push("/manager-order")} 
                        className="dashboard-card"
                    >
                        <div className="card-title">Manager Order</div>
                        <div className="card-description">Create and manage orders</div>
                    </button>
                    
                    <button 
                        onClick={() => router.push("/inventory")} 
                        className="dashboard-card"
                    >
                        <div className="card-title">Inventory</div>
                        <div className="card-description">Manage stock levels</div>
                    </button>
                    
                    <button 
                        onClick={() => router.push("/manager-actions")} 
                        className="dashboard-card"
                    >
                        <div className="card-title">Ordering Trends</div>
                        <div className="card-description">View sales reports</div>
                    </button>
                </div>
            </main>
        </div>
    );
}
