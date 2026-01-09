"use client";

import { FaBoxOpen, FaChartLine, FaUserFriends, FaDollarSign } from "react-icons/fa";

interface DashboardHeaderProps {
  stats: { 
    totalSales: number; 
    totalOrders: number; 
    avgTicket: number; 
    uniqueCustomers: number 
  };
}

const StatsCard = ({ title, value, icon, colorClass }: { title: string; value: string | number; icon: React.ReactNode; colorClass: string }) => (
  <div className="bg-[#18181b] p-5 rounded-xl border border-white/5 shadow-sm flex items-center min-w-[240px] snap-center">
    <div className={`flex-shrink-0 rounded-lg p-3 mr-4 ${colorClass}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-zinc-400 whitespace-nowrap">{title}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
    </div>
  </div>
);

export function DashboardHeader({ stats }: DashboardHeaderProps) {
  const formatPrice = (price: number) => 
    price.toLocaleString("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 });

  return (
    <div className="mb-6 flex overflow-x-auto gap-4 pb-4 sm:pb-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible snap-x mandatory scrollbar-hide">
      <StatsCard 
        title="Ventas Totales" 
        value={formatPrice(stats.totalSales)} 
        icon={<FaDollarSign size={20} />} 
        colorClass="bg-emerald-500/10 text-emerald-500"
      />
      <StatsCard 
        title="Pedidos" 
        value={stats.totalOrders} 
        icon={<FaBoxOpen size={20} />} 
        colorClass="bg-blue-500/10 text-blue-500"
      />
      <StatsCard 
        title="Ticket Promedio" 
        value={formatPrice(stats.avgTicket)} 
        icon={<FaChartLine size={20} />} 
        colorClass="bg-orange-500/10 text-orange-500"
      />
      <StatsCard 
        title="Clientes Únicos" 
        value={stats.uniqueCustomers} 
        icon={<FaUserFriends size={20} />} 
        colorClass="bg-purple-500/10 text-purple-500"
      />
    </div>
  );
}