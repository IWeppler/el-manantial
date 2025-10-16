"use client";

import { useMemo } from "react";
import { OrderWithDetails } from "@/hooks/useDashboard";
import { EggProduction, Expense } from "@prisma/client";
import { SalesChart } from "./charts/SalesChart";
import { ProductionSalesChart } from "./charts/ProductionSalesChart";
import { ExpensesPieChart } from "./charts/ExpensesPieChart";
import { OrdersByDayChart } from "./charts/OrdersByDayChart";
import { categoryOptions } from "@/lib/constants";

interface ReportsPanelProps {
  orders: OrderWithDetails[];
  production: (EggProduction & { user?: { name: string | null } })[];
  expenses: (Expense & { user?: { name: string | null } })[];
}

export function ReportsPanel({
  orders,
  production,
  expenses,
}: ReportsPanelProps) {
  // --- PROCESAMIENTO DE DATOS PARA CADA GRÁFICO ---

  // 1. Datos para Evolución de Ventas
  const salesData = useMemo(() => {
    const salesByDate = orders
      .filter((o) => o.status !== "CANCELADO")
      .reduce((acc, order) => {
        const date = new Date(order.orderDate).toISOString().split("T")[0];
        acc[date] = (acc[date] || 0) + order.totalPrice;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(salesByDate)
      .map(([date, total]) => ({ date, ventas: total }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [orders]);

  // 2. Datos para Producción vs. Ventas
  const productionVsSalesData = useMemo(() => {
    const dataByDate = new Map<
      string,
      { produccion: number; ventas: number }
    >();

    production.forEach((p) => {
      const date = new Date(p.date).toISOString().split("T")[0];
      if (!dataByDate.has(date))
        dataByDate.set(date, { produccion: 0, ventas: 0 });
      dataByDate.get(date)!.produccion += p.quantity;
    });

    orders
      .filter((o) => o.status !== "CANCELADO")
      .forEach((o) => {
        const date = new Date(o.orderDate).toISOString().split("T")[0];
        if (!dataByDate.has(date))
          dataByDate.set(date, { produccion: 0, ventas: 0 });
        dataByDate.get(date)!.ventas += o.mapleQuantity * 30;
      });

    return Array.from(dataByDate.entries())
      .map(([date, values]) => ({ date, ...values }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [orders, production]);

  // 3. Datos para Distribución de Gastos
  const expensesData = useMemo(() => {
    const expensesByCategory = expenses.reduce((acc, expense) => {
      const category = expense.category;
      acc[category] = (acc[category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return categoryOptions
      .map((opt) => ({
        name: opt.label,
        value: expensesByCategory[opt.value] || 0,
      }))
      .filter((item: { name: string; value: number }) => item.value > 0);
  }, [expenses]);

  // 4. Datos para Pedidos por Día de la Semana
  const ordersByDayData = useMemo(() => {
    const days = [
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
    ];
    const counts = Array(7).fill(0);
    orders.forEach((order) => {
      const dayIndex = new Date(order.orderDate).getDay();
      counts[dayIndex]++;
    });
    return days.map((name, index) => ({ name, pedidos: counts[index] }));
  }, [orders]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <ChartCard title="Evolución de Ventas">
        <SalesChart data={salesData} />
      </ChartCard>
      <ChartCard title="Producción vs. Ventas (Huevos)">
        <ProductionSalesChart data={productionVsSalesData} />
      </ChartCard>
      <ChartCard title="Distribución de Gastos">
        <ExpensesPieChart data={expensesData} />
      </ChartCard>
      <ChartCard title="Pedidos por Día de la Semana">
        <OrdersByDayChart data={ordersByDayData} />
      </ChartCard>
    </div>
  );
}

// Componente helper para envolver cada gráfico
const ChartCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="bg-white p-6 rounded-xl shadow">
    <h3 className="font-bold text-lg mb-4 text-gray-800">{title}</h3>
    <div className="h-72 w-full">{children}</div>
  </div>
);
