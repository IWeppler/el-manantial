"use client";

import { useMemo } from "react";
import { PaymentMethod } from "@prisma/client";
import { OrderWithDetails } from "@/hooks/useDashboard";
import { ArrowRight } from "lucide-react";

interface DailySummaryProps {
  orders: OrderWithDetails[];
}

interface SummaryRowProps {
  label: string;
  value: string | number;
  valueColor?: string;
}

export function DailySummary({ orders }: DailySummaryProps) {
  const summary = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filtramos órdenes de HOY que no estén canceladas
    const todaysOrders = orders.filter((o) => {
      const orderDate = new Date(o.orderDate);
      return orderDate >= today && o.status !== "CANCELADO";
    });

    return {
      deliveries: todaysOrders.filter((o) => o.schedule?.type === "DELIVERY")
        .length,
      pickups: todaysOrders.filter((o) => o.schedule?.type === "PICKUP").length,
      cash: todaysOrders
        .filter((o) => o.paymentMethod === PaymentMethod.CASH)
        .reduce((sum, o) => sum + o.totalPrice, 0),
      transfer: todaysOrders
        .filter((o) => o.paymentMethod === PaymentMethod.TRANSFER)
        .reduce((sum, o) => sum + o.totalPrice, 0),
    };
  }, [orders]);

  const formatPrice = (price: number) =>
    price.toLocaleString("es-AR", { style: "currency", currency: "ARS" });

  return (
    <div className="bg-[#18181b] rounded-xl border border-white/5 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white">Resumen Hoy</h3>
        <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded border border-white/5">
          En vivo
        </span>
      </div>

      <div className="space-y-4 text-sm">
        <SummaryRow label="Envíos" value={summary.deliveries} />
        <SummaryRow label="Retiros" value={summary.pickups} />
        <div className="h-px bg-white/5 my-2"></div>
        <SummaryRow
          label="Efectivo"
          value={formatPrice(summary.cash)}
          valueColor="text-emerald-400"
        />
        <SummaryRow
          label="Transferencia"
          value={formatPrice(summary.transfer)}
          valueColor="text-blue-400"
        />
      </div>

      <button className="w-full mt-5 flex items-center justify-center gap-2 text-xs text-zinc-500 hover:text-white transition-colors py-2 border border-dashed border-white/10 rounded-lg hover:bg-white/5">
        Ver Cierre de Caja <ArrowRight size={12} />
      </button>
    </div>
  );
}

const SummaryRow = ({
  label,
  value,
  valueColor = "text-white",
}: SummaryRowProps) => (
  <div className="flex justify-between items-center">
    <span className="text-zinc-500">{label}</span>
    <span className={`font-mono font-medium ${valueColor}`}>{value}</span>
  </div>
);
