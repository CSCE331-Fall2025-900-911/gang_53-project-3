"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "./styles.css";

type Employee = { employee_id: number; name: string; role: string };
type XRow = { hour: number; total_sales: number };
type ZReport = { total_orders: number; total_sales: number; avg_order_value: number };

export default function ManagerPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [xReport, setXReport] = useState<XRow[]>([]);
  const [zReport, setZReport] = useState<ZReport | null>(null);

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

  const router = useRouter();

  return (
    <div className="manager-page">
      <header>
        <button onClick={() => router.push("/manager-dashboard")} className="back-btn">← Go back to Main Page</button>
        <h1>Manage Employees and View Reports</h1>
      </header>

      {/* Employees section */}
      <section className="employees-section">
        <h2>Manage Employees</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Name</th><th>Role</th></tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.employee_id}><td>{e.name}</td><td>{e.role}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="button-row">
          <button>Add Employee</button>
          <button>Delete Employee</button>
          <button>Clear Changes</button>
          <button>Update Database</button>
        </div>
      </section>

      {/* X-Report */}
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

      {/* Z-Report */}
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