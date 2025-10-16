"use client";

import { useMemo } from "react";
import { Stock, PaymentMethod } from "@prisma/client";
import { OrderWithDetails } from "@/hooks/useDashboard";
import { StockManager } from "./StockManager";
import { FaBoxOpen, FaChartLine, FaUserFriends, FaDollarSign } from "react-icons/fa";

// StatsCard: Un componente reutilizable para nuestros KPIs
const StatsCard = ({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) => (
  <div className="bg-white p-5 rounded-xl shadow">
    <div className="flex items-center">
      <div className="flex-shrink-0 bg-gray-100 rounded-full p-3 mr-4">{icon}</div>
      <div>
        <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  </div>
);

// ResumenDiario: El resumen de hoy, ahora como un componente limpio
const DailySummary = ({ orders }: { orders: OrderWithDetails[] }) => {
  const summary = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaysOrders = orders.filter(o => new Date(o.orderDate) >= today && (o.status === "PENDIENTE" || o.status === "CONFIRMADO"));

    return {
      deliveries: todaysOrders.filter(o => o.schedule.type === 'DELIVERY').length,
      pickups: todaysOrders.filter(o => o.schedule.type === 'PICKUP').length,
      cash: todaysOrders.filter(o => o.paymentMethod === PaymentMethod.CASH).reduce((sum, o) => sum + o.totalPrice, 0),
      transfer: todaysOrders.filter(o => o.paymentMethod === PaymentMethod.TRANSFER).reduce((sum, o) => sum + o.totalPrice, 0),
    };
  }, [orders]);

  const formatPrice = (price: number) => price.toLocaleString("es-AR", { style: "currency", currency: "ARS" });

  return (
    <div className="bg-white p-5 rounded-xl shadow">
      <h3 className="font-bold text-lg mb-3">Resumen para Hoy</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between"><span>Envíos:</span> <strong>{summary.deliveries}</strong></div>
        <div className="flex justify-between"><span>Retiros:</span> <strong>{summary.pickups}</strong></div>
        <div className="flex justify-between"><span>A cobrar (Efectivo):</span> <strong>{formatPrice(summary.cash)}</strong></div>
        <div className="flex justify-between"><span>A verificar (Transf.):</span> <strong>{formatPrice(summary.transfer)}</strong></div>
      </div>
    </div>
  );
};

// Componente principal del Header
interface DashboardHeaderProps {
  stats: { totalSales: number; totalOrders: number; avgTicket: number; uniqueCustomers: number };
  orders: OrderWithDetails[];
  stock: Stock | null;
  onUpdateStock: (amount: number) => Promise<void>;
}

export function DashboardHeader({ stats, orders, stock, onUpdateStock }: DashboardHeaderProps) {
  const formatPrice = (price: number) => price.toLocaleString("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0,});

  return (
    <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {/* KPIs Principales */}
      <StatsCard title="Ventas Totales" value={formatPrice(stats.totalSales)} icon={<FaDollarSign size={22} className="text-green-500" />} />
      <StatsCard title="Pedidos" value={stats.totalOrders} icon={<FaBoxOpen size={22} className="text-blue-500" />} />
      <StatsCard title="Ticket Promedio" value={formatPrice(stats.avgTicket)} icon={<FaChartLine size={22} className="text-orange-500" />} />
      <StatsCard title="Clientes" value={stats.uniqueCustomers} icon={<FaUserFriends size={22} className="text-purple-500" />} />
      
      {/* Widgets Operativos */}
      <div className="sm:col-span-2 lg:col-span-2">
        <DailySummary orders={orders} />
      </div>
      <div className="sm:col-span-2 lg:col-span-2">
         <StockManager stock={stock} onUpdateStock={onUpdateStock} />
      </div>
    </div>
  );
}