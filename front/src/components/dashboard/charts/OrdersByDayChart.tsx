"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const OrdersByDayChart = ({ data }: { data: { name: string, pedidos: number }[] }) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" fontSize={12} />
      <YAxis allowDecimals={false} fontSize={12} />
      <Tooltip />
      <Bar dataKey="pedidos" fill="#8884d8" />
    </BarChart>
  </ResponsiveContainer>
);