"use client";

import { useState } from "react";
import {
  OrderStatus,
  Stock,
  Settings,
  EggProduction,
  Expense,
  Schedule,
} from "@prisma/client";
import { signOut } from "next-auth/react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useDashboardLogic, OrderWithDetails } from "@/hooks/useDashboard";
import { DashboardHeader } from "./dashboard/DashboardHeader";
import { DashboardTabs } from "./dashboard/DashboardTabs";
import { DashboardControls } from "./dashboard/Controles";
import { OrdersList } from "./dashboard/Precios";
import { AnalyticsPanel } from "./dashboard/AnalyticsPanel";
import { SettingsPanel } from "./dashboard/SettingsPanel";
import { AdminOrderForm } from "./dashboard/AdminOrderForm";
import { ReportsPanel } from "./dashboard/ReportsPanel";

// Definimos un tipo robusto para las props, incluyendo los priceTiers
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
  // --- ESTADOS DEL COMPONENTE ---
  const [activeTab, setActiveTab] = useState("pedidos");
  const [stock, setStock] = useState(initialStock);
  const [production, setProduction] = useState(initialProduction);
  const [expenses, setExpenses] = useState(initialExpenses);
  const [isCreateOrderModalOpen, setCreateOrderModalOpen] = useState(false);

  // --- LÓGICA DE ÓRDENES ---
  const {
    orders,
    setOrders,
    filters,
    setFilters,
    filteredOrders,
    stats,
    currentPage,
    setCurrentPage,
    ordersPerPage,
  } = useDashboardLogic({ initialOrders });

  // --- HANDLERS ---
  const handleUpdateStock = async (amount: number) => {
    try {
      const response = await axios.post("/api/stock", { amount });
      setStock(response.data);
      toast.success("Stock actualizado correctamente.");
    } catch (error) {
      toast.error("Error al actualizar el stock.");
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    // Actualización optimista para una UI instantánea
    const previousOrders = orders;
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));

    try {
      await axios.patch(`/api/orders/${orderId}`, { status: newStatus });
      toast.success("Estado del pedido actualizado.");
    } catch (error) {
      toast.error("Error al actualizar. Revirtiendo cambios.");
      console.error(error);
      setOrders(previousOrders); // Revierte al estado anterior si falla
    }
  };

  const handleOrderCreated = (newOrder: OrderWithDetails) => {
    setOrders((prevOrders) => [newOrder, ...prevOrders]);
    // Opcional: Actualiza el stock visualmente también
    setStock(prev => prev ? { ...prev, mapleCount: prev.mapleCount - newOrder.mapleQuantity } : null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            Panel de Administración
          </h1>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="rounded-full bg-neutral-950 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-neutral-800"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <DashboardTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Renderizado condicional basado en la pestaña activa */}
        {activeTab === "pedidos" && (
          <>
            {/* 1. Panel de Indicadores Clave */}
            <DashboardHeader
              stats={stats}
              orders={orders}
              stock={stock}
              onUpdateStock={handleUpdateStock}
            />

            {/* 2. Barra de Herramientas (Filtros y Acciones) */}
            <DashboardControls
              filters={filters}
              setFilters={setFilters}
              setCurrentPage={setCurrentPage}
              onOpenCreateOrderModal={() => setCreateOrderModalOpen(true)}
            />

            {/* 3. Contenido Principal (Lista de Pedidos) */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <OrdersList
                orders={filteredOrders}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                ordersPerPage={ordersPerPage}
                onStatusChange={handleStatusChange}
              />
            </div>
          </>
        )}

        {activeTab === "analisis" && (
          <AnalyticsPanel
            orders={orders}
            production={production}
            expenses={expenses}
            setProduction={setProduction}
            setExpenses={setExpenses}
          />
        )}

        {activeTab === "reportes" && (
          <ReportsPanel 
            orders={orders}
            production={production}
            expenses={expenses}
          />
        )}

        {activeTab === "configuracion" && (
          <SettingsPanel initialSettings={initialSettings} />
        )}
      </main>

      {/* El Modal para crear pedidos vive aquí, fuera del flujo principal */}
      <AdminOrderForm
        isOpen={isCreateOrderModalOpen}
        onClose={() => setCreateOrderModalOpen(false)}
        settings={initialSettings}
        schedules={initialSchedules}
        onOrderCreated={handleOrderCreated}
      />
    </div>
  );
}