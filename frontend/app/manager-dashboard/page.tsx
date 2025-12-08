"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "./styles.css";
import BackButton from "@/components/BackButton";

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
        <div className="dashboard">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <h2>Loading...</h2>
          </div>
        </div>
      );
    }

    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <h1>Bobalicious-53</h1>
                <div className="account-info">
                    <p>Currently logged in as: <strong>{employee?.name || 'Unknown'}</strong></p>
                    <p>Account type: <strong>{employee?.role || 'Unknown'}</strong></p>
                </div>
                <BackButton/>   
            </header>

            <main className="dashboard-main">
                <button onClick={() => router.push("/manager-order")} className="btn">Manager Order</button>
                <button onClick={() => router.push("/inventory")} className="btn">Inventory</button>
                <button onClick={() => router.push("/manager-actions")} className="btn">Ordering Trends</button>
            </main>

            <footer className="dashboard-footer">
                <button onClick={handleLogout} className="btn logout-btn">Logout</button>
            </footer>
        </div>
    );
}
