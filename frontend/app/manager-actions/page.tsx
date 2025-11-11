"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "./styles.css";

type Employee = { employee_id: number; name: string; role: string; username?: string };
type XRow = { hour: number; total_sales: number };
type ZReport = { total_orders: number; total_sales: number; avg_order_value: number };

export default function ManagerPage() {
    const router = useRouter();

    // State
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [xReport, setXReport] = useState<XRow[]>([]);
    const [zReport, setZReport] = useState<ZReport | null>(null);

    // Modal states for adding employees
    const [showModal, setShowModal] = useState(false);
    const [newEmployee, setNewEmployee] = useState({
        name: "",
        role: "",
        username: "",
        password: "",
    });

    // Fetch data
    const fetchEmployees = async () => {
        const res = await fetch("http://localhost:8080/api/employees");
        setEmployees(await res.json());
    };

    const refreshXReport = async () => {
        const res = await fetch("http://localhost:8080/api/reports/xreport");
        setXReport(await res.json());
    };

    const getZReport = async () => {
        const res = await fetch("http://localhost:8080/api/reports/zreport");
        setZReport(await res.json());
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    // Employee actions
    const addEmployee = async () => {
        if (!newEmployee.name || !newEmployee.role || !newEmployee.username || !newEmployee.password) {
            alert("Please fill all fields!");
            return;
        }
        const res = await fetch("http://localhost:8080/api/employees", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newEmployee),
        });
        if (res.ok) {
            setShowModal(false);
            setNewEmployee({ name: "", role: "", username: "", password: "" });
            fetchEmployees();
        }
    };

    const deleteEmployee = async (id: number) => {
        if (confirm("Are you sure you want to delete this employee?")) {
            await fetch(`http://localhost:8080/api/employees/${id}`, { method: "DELETE" });
            fetchEmployees();
        }
    };

    return (
        <div className="manager-page">
            <header>
                <button onClick={() => router.push("/manager-dashboard")} className="back-btn">
                    ← Go back to Main Page
                </button>
                <h1>Manage Employees and View Reports</h1>
            </header>

            {/* Employees Section */}
            <section className="employees-section">
                <h2>Manage Employees</h2>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr><th>ID</th><th>Name</th><th>Role</th><th>Username</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {employees.map((e) => (
                                <tr key={e.employee_id}>
                                    <td>{e.employee_id}</td>
                                    <td>{e.name}</td>
                                    <td>{e.role}</td>
                                    <td>{e.username || "-"}</td>
                                    <td>
                                        <button className="delete-btn" onClick={() => deleteEmployee(e.employee_id)}>🗑️</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="button-row">
                    <button onClick={() => setShowModal(true)}>Add Employee</button>
                    <button onClick={() => fetchEmployees()}>Refresh</button>
                </div>
            </section>

            {/* Add Employee Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>Add Employee</h3>
                        <label>
                            Name:
                            <input
                                value={newEmployee.name}
                                onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                            />
                        </label>
                        <label>
                            Role:
                            <select
                                value={newEmployee.role}
                                onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
                            >
                                <option value="">Select Role</option>
                                <option value="employee">Employee</option>
                                <option value="manager">Manager</option>
                            </select>
                        </label>
                        <label>
                            Username:
                            <input
                                value={newEmployee.username}
                                onChange={(e) => setNewEmployee({ ...newEmployee, username: e.target.value })}
                            />
                        </label>
                        <label>
                            Password:
                            <input
                                type="password"
                                value={newEmployee.password}
                                onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                            />
                        </label>
                        <div className="modal-buttons">
                            <button onClick={addEmployee}>Add</button>
                            <button onClick={() => setShowModal(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* X-Report Section */}
            <section className="report-section">
                <h2>X-Report</h2>
                <button className="center-btn" onClick={refreshXReport}>Refresh X-Report</button>
                <div className="table-container">
                    <table>
                        <thead><tr><th>Hour</th><th>Sales</th></tr></thead>
                        <tbody>
                            {xReport.length ? xReport.map((x, i) => (
                                <tr key={i}>
                                    <td>{x.hour ?? "No Data"}</td>
                                    <td>${Number(x.total_sales).toFixed(2)}</td>
                                </tr>
                            )) : (
                                <tr><td>No Data</td><td>No orders found for today</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Z-Report Section */}
            <section className="report-section">
                <h2>Z-Report</h2>
                <button className="center-btn" onClick={getZReport}>Get Z-Report</button>
                <div className="table-container">
                    <table>
                        <thead><tr><th>Statistic Name</th><th>Statistic Data</th></tr></thead>
                        <tbody>
                            {zReport ? (
                                <>
                                    <tr><td>Total Orders</td><td>{zReport.total_orders}</td></tr>
                                    <tr><td>Total Sales</td><td>${Number(zReport.total_sales).toFixed(2)}</td></tr>
                                    <tr><td>Average Order Value</td><td>${Number(zReport.avg_order_value).toFixed(2)}</td></tr>
                                </>
                            ) : (
                                <tr><td colSpan={2}>No content in table</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}