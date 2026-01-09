"use client";

import React from "react";
import { FiltersState } from "@/hooks/useDashboard";
import { Search, RotateCcw, Plus, UserPlus, Filter } from "lucide-react";

interface DashboardControlsProps {
  filters: FiltersState;
  setFilters: React.Dispatch<React.SetStateAction<FiltersState>>;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  onOpenCreateOrderModal: () => void;
  onOpenCreateClientModal: () => void; // Nueva prop para el botón de cliente
}

export function DashboardControls({
  filters,
  setFilters,
  setCurrentPage,
  onOpenCreateOrderModal,
  onOpenCreateClientModal,
}: DashboardControlsProps) {
  const handleFilterChange = (key: keyof FiltersState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({
      scheduleType: "ALL",
      status: "ALL",
      paymentMethod: "ALL",
      searchTerm: "",
      dateRange: "ALL",
    });
    setCurrentPage(1);
  };

  // Estilos comunes para los selects
  const selectClassName =
    "bg-[#0f0f11] border border-white/10 text-zinc-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none";

  return (
    <div className="bg-[#18181b] p-4 rounded-xl border border-white/5 mb-6">
      <div className="flex flex-col xl:flex-row items-center justify-between gap-4">
        {/* --- SECCIÓN DE FILTROS Y BÚSQUEDA --- */} 
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto flex-grow">
          {/* 1. Buscador */}
          <div className="relative flex-grow min-w-[200px] md:max-w-xs">
            <Search className="absolute left-3 top-2.5 text-zinc-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#0f0f11] border border-white/10 rounded-lg text-sm text-zinc-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder:text-zinc-600 transition-all"
            />
          </div>

          {/* 2. Filtro Estado */}
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className={selectClassName}
          >
            <option value="ALL">Estado: Todos</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="CONFIRMADO">Confirmado</option>
            <option value="ENTREGADO">Entregado</option>
            <option value="CANCELADO">Cancelado</option>
          </select>

          {/* 3. Filtro Entrega (Envío/Retiro) */}
          <select
            value={filters.scheduleType}
            onChange={(e) => handleFilterChange("scheduleType", e.target.value)}
            className={selectClassName}
          >
            <option value="ALL">Entrega: Todas</option>
            <option value="DELIVERY">Solo Envíos</option>
            <option value="PICKUP">Solo Retiros</option>
          </select>

          {/* 4. Filtro Pago (Efectivo/Transferencia) */}
          <select
            value={filters.paymentMethod}
            onChange={(e) =>
              handleFilterChange("paymentMethod", e.target.value)
            }
            className={selectClassName}
          >
            <option value="ALL">Pago: Todos</option>
            <option value="CASH">Efectivo</option>
            <option value="TRANSFER">Transferencia</option>
          </select>

          {/* Botón Limpiar */}
          <button
            onClick={resetFilters}
            className="px-3 py-2.5 text-sm font-medium text-zinc-400 bg-[#0f0f11] border border-white/10 rounded-lg hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2"
            title="Limpiar filtros"
          >
            <RotateCcw size={16} />
          </button>
        </div>

        {/* --- SECCIÓN DE ACCIONES (Botones) --- */}
        <div className="w-full xl:w-auto flex flex-col sm:flex-row gap-3 flex-shrink-0">
          {/* Botón Crear Cliente */}
          <button
            onClick={onOpenCreateClientModal}
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-lg bg-zinc-800 border border-white/10 text-zinc-200 text-sm font-medium hover:bg-zinc-700 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <UserPlus size={16} />
            Cliente
          </button>

          {/* Botón Crear Pedido */}
          <button
            onClick={onOpenCreateOrderModal}
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus size={16} />
            Pedido
          </button>
        </div>
      </div>
    </div>
  );
}
