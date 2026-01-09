"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Stock,
  Settings,
  EggProduction,
  Expense,
  Schedule,
  User,
} from "@prisma/client";
import { OrderWithDetails, useDashboardLogic } from "@/hooks/useDashboard";

// --- IMPORTACIÓN DE COMPONENTES FUNCIONALES ---
import { DashboardHeader } from "./dashboard/DashboardHeader";
import { DashboardControls } from "./dashboard/Controles";
import { OrdersTable } from "./dashboard/OrdersTable";
import { StockManager } from "./dashboard/StockManager";
import { DailySummary } from "./dashboard/DailySummary";
import { AdminOrderForm } from "./dashboard/AdminOrderForm";
import { CreateClientModal } from "./dashboard/CreateClientModal";

import { AnalyticsPanel } from "./dashboard/AnalyticsPanel";
import { SettingsPanel } from "./dashboard/SettingsPanel";
import { ReportsPanel } from "./dashboard/ReportsPanel";
import { DashboardNavbar } from "./dashboard/DashboardNavbar";

// --- TIPOS ---
type SettingsWithTiers = Settings & {
  priceTiers: { minQuantity: number; price: number }[];
};

interface DashboardClientProps {
  initialOrders: OrderWithDetails[];
  initialStock: Stock | null;
  initialSettings: SettingsWithTiers;
  initialProduction: EggProduction[];
  initialExpenses: Expense[];
  initialSchedules: Schedule[];
}

export function DashboardClient({
  initialOrders,
  initialStock,
  initialSettings,
  initialProduction,
  initialExpenses,
  initialSchedules,
}: DashboardClientProps) {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("pedidos");
  const [stock, setStock] = useState(initialStock);

  const [isCreateOrderModalOpen, setCreateOrderModalOpen] = useState(false);
  const [isCreateClientModalOpen, setCreateClientModalOpen] = useState(false);

  // 2. Lógica del Dashboard (Filtros, Paginación, Stats derivados)
  const {
    orders,
    setOrders,
    filters,
    setFilters,
    filteredOrders,
    stats,
    currentPage,
    setCurrentPage,
  } = useDashboardLogic({ initialOrders });

  // 3. Handlers
  const handleUpdateStock = async (amount: number) => {
    // Aquí idealmente llamarías a tu API.
    // Por ahora hacemos actualización optimista:
    if (stock) {
      // Simulación: en una app real, harías axios.post('/api/stock', ...)
      setStock({ ...stock, mapleCount: stock.mapleCount + amount });
    }
  };

  const handleOrderCreated = (newOrder: OrderWithDetails) => {
    setOrders((prev) => [newOrder, ...prev]);

    if (stock) {
      setStock({
        ...stock,
        mapleCount: stock.mapleCount - newOrder.mapleQuantity,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f11] text-zinc-100 font-sans selection:bg-blue-500/30">
      {/* HEADER MODULARIZADO (Con Tabs incluidos) */}
      <DashboardNavbar
        user={session?.user as User}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* --- CONTENIDO PRINCIPAL --- */}
      <main className="w-full max-w-[1600px] mx-auto py-6 px-4 sm:px-6">
        {/* --- PESTAÑA: PEDIDOS --- */}
        {activeTab === "pedidos" && (
          <div className="space-y-6">
            {/* 1. KPIs Superiores (Componente Funcional) */}
            <DashboardHeader stats={stats} />

            {/* 2. Layout Grid Principal */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
              {/* COLUMNA IZQUIERDA (3/4): Filtros y Tabla */}
              <div className="lg:col-span-3 space-y-6">
                {/* Barra de Controles (Búsqueda, Filtros, Botón Crear Pedido) */}
                <DashboardControls
                  filters={filters}
                  setFilters={setFilters}
                  setCurrentPage={setCurrentPage}
                  onOpenCreateOrderModal={() => setCreateOrderModalOpen(true)}
                  onOpenCreateClientModal={() => setCreateClientModalOpen(true)}
                />

                {/* Tabla de Órdenes */}
                <div className="bg-[#18181b] rounded-xl border border-white/5 overflow-hidden">
                  <OrdersTable orders={filteredOrders} />
                </div>
              </div>

              {/* COLUMNA DERECHA (1/4): Widgets Operativos */}
              <div className="lg:col-span-1 space-y-6">
                {/* Widget de Stock (Componente Funcional) */}
                <StockManager stock={stock} onUpdateStock={handleUpdateStock} />

                {/* Resumen del Día (Componente Funcional) */}
                <DailySummary orders={orders} />
              </div>
            </div>
          </div>
        )}

        {/* --- OTRAS PESTAÑAS --- */}
        {activeTab === "analisis" && (
          <AnalyticsPanel
            orders={orders}
            production={initialProduction}
            expenses={initialExpenses}
            setProduction={() => {}} // Pasar setters reales si la lógica lo requiere
            setExpenses={() => {}}
          />
        )}

        {activeTab === "reportes" && (
          <ReportsPanel
            orders={orders}
            production={initialProduction}
            expenses={initialExpenses}
          />
        )}

        {activeTab === "configuracion" && (
          <SettingsPanel
            initialSettings={initialSettings}
            initialSchedules={initialSchedules}
          />
        )}
      </main>

      {/* --- MODALES FLOTANTES --- */}
      {/* Modal Crear Pedido */}
      <AdminOrderForm
        isOpen={isCreateOrderModalOpen}
        onClose={() => setCreateOrderModalOpen(false)}
        settings={initialSettings}
        schedules={initialSchedules}
        onOrderCreated={handleOrderCreated}
      />

      {/* Modal Crear Cliente */}
      <CreateClientModal
        isOpen={isCreateClientModalOpen}
        onClose={() => setCreateClientModalOpen(false)}
      />
    </div>
  );
}
