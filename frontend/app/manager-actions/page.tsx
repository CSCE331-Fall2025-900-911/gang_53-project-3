"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "./styles.css";

type Employee = { employee_id: number; name: string; role: string };
type XRow = { hour: number; total_sales: number };
type ZReport = { total_orders: number; total_sales: number; avg_order_value: number };

export default function ManagerPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [editableEmployees, setEditableEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [xReport, setXReport] = useState<XRow[]>([]);
  const [zReport, setZReport] = useState<ZReport | null>(null);
  const [loading, setLoading] = useState(false);

  // Use production API URL or fall back to localhost
  const apiUrl = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_LOCAL_API_URL || "http://localhost:5000").replace(/\/$/, '');

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/api/employees`);
      if (!res.ok) throw new Error("Failed to fetch employees");
      const data = await res.json();
      // Handle wrapped response format
      const employeeData = Array.isArray(data) ? data : data?.data || [];
      setEmployees(employeeData);
      setEditableEmployees([...employeeData]);
    } catch (err) {
      console.error("Error fetching employees:", err);
      setEmployees([]);
      setEditableEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshXReport = async () => {
    try {
      setLoading(true);
      console.log(`📊 Fetching X-Report from ${apiUrl}/api/reports/xreport`);
      const res = await fetch(`${apiUrl}/api/reports/xreport`);
      console.log(`📡 Response status: ${res.status}`);
      if (!res.ok) {
        const responseText = await res.text();
        console.error(`❌ Backend error:`, responseText);
        throw new Error("Failed to fetch X report");
      }
      const data = await res.json();
      console.log(`✅ X-Report data:`, data);
      // Handle wrapped response format
      const report = Array.isArray(data) ? data : data?.data || [];
      setXReport(report);
    } catch (err) {
      console.error("Error fetching X report:", err);
      alert(`Failed to refresh X-Report: ${err instanceof Error ? err.message : String(err)}`);
      setXReport([]);
    } finally {
      setLoading(false);
    }
  };

  const getZReport = async () => {
    try {
      setLoading(true);
      console.log(`📊 Fetching Z-Report from ${apiUrl}/api/reports/zreport`);
      const res = await fetch(`${apiUrl}/api/reports/zreport`);
      console.log(`📡 Response status: ${res.status}`);
      if (!res.ok) {
        const responseText = await res.text();
        console.error(`❌ Backend error:`, responseText);
        throw new Error("Failed to fetch Z report");
      }
      const data = await res.json();
      console.log(`✅ Z-Report data:`, data);
      // Handle wrapped response format
      const report = Array.isArray(data) ? data : data?.data;
      setZReport(report || null);
    } catch (err) {
      console.error("Error fetching Z report:", err);
      alert(`Failed to get Z-Report: ${err instanceof Error ? err.message : String(err)}`);
      setZReport(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = () => {
    const newEmployee: Employee = {
      employee_id: Math.max(...editableEmployees.map(e => e.employee_id), 0) + 1,
      name: "Name",
      role: "Role"
    };
    setEditableEmployees([...editableEmployees, newEmployee]);
  };

  const handleDeleteEmployee = () => {
    if (selectedEmployeeId === null) {
      alert("Please select an employee to delete");
      return;
    }
    setEditableEmployees(editableEmployees.filter(emp => emp.employee_id !== selectedEmployeeId));
    setSelectedEmployeeId(null);
  };

  const handleClearChanges = () => {
    setEditableEmployees([...employees]);
  };

  const handleUpdateDatabase = async () => {
    try {
      setLoading(true);
      
      // Find employees that were deleted
      const deletedEmployees = employees.filter(emp => 
        !editableEmployees.find(e => e.employee_id === emp.employee_id)
      );
      
      // Delete employees that are no longer in the list
      for (const emp of deletedEmployees) {
        console.log(`🗑️ Deleting employee ${emp.employee_id}: ${emp.name}`);
        const res = await fetch(`${apiUrl}/api/employees/${emp.employee_id}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" }
        });
        if (!res.ok) throw new Error(`Failed to delete employee ${emp.employee_id}`);
      }
      
      // Separate new and existing employees
      const newEmployees = editableEmployees.filter(emp => 
        !employees.find(e => e.employee_id === emp.employee_id)
      );
      const existingEmployees = editableEmployees.filter(emp => 
        employees.find(e => e.employee_id === emp.employee_id)
      );
      
      // For new employees, find the max ID and assign new IDs
      let maxId = Math.max(...employees.map(e => e.employee_id), 0);
      
      for (const emp of newEmployees) {
        maxId++;
        console.log(`📝 Adding new employee with ID ${maxId}: ${emp.name} (${emp.role})`);
        
        const res = await fetch(`${apiUrl}/api/employees`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employee_id: maxId,  // Explicitly provide the ID
            name: emp.name,
            role: emp.role,
            username: emp.name.toLowerCase().replace(/\s+/g, "_"),
            password: "password123"
          })
        });
        console.log(`📡 Response status: ${res.status}`);
        
        if (!res.ok) {
          const responseText = await res.text();
          console.error(`❌ Backend error (status ${res.status}):`, responseText);
          let errorMsg = "Unknown error";
          try {
            const errorData = JSON.parse(responseText);
            errorMsg = errorData.error || errorData.message || errorMsg;
          } catch {
            errorMsg = responseText || `HTTP ${res.status}`;
          }
          throw new Error(errorMsg);
        }
        const data = await res.json();
        console.log(`✅ Employee added:`, data);
      }
      
      // Update existing employees
      for (const emp of existingEmployees) {
        const original = employees.find(e => e.employee_id === emp.employee_id);
        if (original && (original.name !== emp.name || original.role !== emp.role)) {
          console.log(`📝 Updating employee ${emp.employee_id}: ${emp.name} (${emp.role})`);
          const res = await fetch(`${apiUrl}/api/employees/${emp.employee_id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: emp.name,
              role: emp.role,
              username: emp.name.toLowerCase().replace(/\s+/g, "_"),
              password: "password123"
            })
          });
          if (!res.ok) throw new Error("Failed to update employee");
        }
      }
      
      alert("Employees updated successfully");
      await fetchEmployees();
    } catch (err) {
      console.error("Error updating employees:", err);
      alert(`Failed to update employees: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (id: number, newName: string) => {
    setEditableEmployees(editableEmployees.map(emp =>
      emp.employee_id === id ? { ...emp, name: newName } : emp
    ));
  };

  const handleRoleChange = (id: number, newRole: string) => {
    setEditableEmployees(editableEmployees.map(emp =>
      emp.employee_id === id ? { ...emp, role: newRole } : emp
    ));
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
              {editableEmployees.map((e) => (
                <tr 
                  key={e.employee_id}
                  onClick={() => setSelectedEmployeeId(e.employee_id)}
                  className={selectedEmployeeId === e.employee_id ? "selected" : ""}
                  style={{
                    cursor: "pointer"
                  }}
                >
                  <td>
                    <input
                      type="text"
                      value={e.name}
                      onChange={(ev) => handleNameChange(e.employee_id, ev.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={e.role}
                      onChange={(ev) => handleRoleChange(e.employee_id, ev.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="button-row">
          <button onClick={handleAddEmployee} disabled={loading}>Add Employee</button>
          <button onClick={handleDeleteEmployee} disabled={loading}>Delete Employee</button>
          <button onClick={handleClearChanges} disabled={loading}>Clear Changes</button>
          <button onClick={handleUpdateDatabase} disabled={loading}>Update Database</button>
        </div>
      </section>

      {/* X-Report */}
      <section className="report-section">
        <h2>X-Report</h2>
        <button className="center-btn" onClick={refreshXReport} disabled={loading}>Refresh X-Report</button>
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
                <tr><td colSpan={2}>No orders found for today</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Z-Report */}
      <section className="report-section">
        <h2>Z-Report</h2>
        <button className="center-btn" onClick={getZReport} disabled={loading}>Get Z-Report</button>
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