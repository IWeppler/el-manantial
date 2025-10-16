"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#ef4444', '#f97316', '#84cc16', '#22c55e', '#06b6d4', '#6366f1', '#d946ef'];

export const ExpensesPieChart = ({ data }: { data: { name: string, value: number }[] }) => (
  <ResponsiveContainer width="100%" height="100%">
    <PieChart>
      <Tooltip formatter={(value: number) => value.toLocaleString("es-AR", { style: "currency", currency: "ARS" })}/>
      <Legend />
      <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
    </PieChart>
  </ResponsiveContainer>
);