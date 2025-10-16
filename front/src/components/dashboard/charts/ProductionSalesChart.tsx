"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const ProductionSalesChart = ({ data }: { data: { date: string, produccion: number, ventas: number }[] }) => (
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="date" fontSize={12} tickFormatter={(date) => new Date(date).toLocaleDateString('es-AR', {day: '2-digit', month: '2-digit'})}/>
      <YAxis fontSize={12} />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="produccion" name="Producción" stroke="#f59e0b" strokeWidth={2} />
      <Line type="monotone" dataKey="ventas" name="Ventas" stroke="#3b82f6" strokeWidth={2} />
    </LineChart>
  </ResponsiveContainer>
);