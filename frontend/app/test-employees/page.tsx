'use client';

import { useEffect, useState } from 'react';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/employees`);
        const data = await res.json();
        setEmployees(data.data || []);
      } catch (err) {
        console.error('Error fetching employees:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Employees</h1>
      <ul className="space-y-2">
        {employees.map((e) => (
          <li key={e.employee_id} className="p-3 border rounded-md">
            <strong>{e.name}</strong> — {e.role}
          </li>
        ))}
      </ul>
    </main>
  );
}