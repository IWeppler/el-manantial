"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const SalesChart = ({ data }: { data: { date: string, ventas: number }[] }) => (
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="date" fontSize={12} tickFormatter={(date) => new Date(date).toLocaleDateString('es-AR', {day: '2-digit', month: '2-digit'})} />
      <YAxis fontSize={12} tickFormatter={(value) => `$${(value / 1000)}k`} />
      <Tooltip formatter={(value: number) => value.toLocaleString("es-AR", { style: "currency", currency: "ARS" })}/>
      <Legend />
      <Line type="monotone" dataKey="ventas" stroke="#16a34a" strokeWidth={2} activeDot={{ r: 8 }} />
    </LineChart>
  </ResponsiveContainer>
);