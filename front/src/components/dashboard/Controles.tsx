"use client";

import React from "react";
import { FiltersState } from "@/hooks/useDashboard";

// --- Tipos de Datos ---
interface DashboardControlsProps {
  filters: FiltersState;
  setFilters: React.Dispatch<React.SetStateAction<FiltersState>>;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  onOpenCreateOrderModal: () => void;
}

// --- Componente Principal (Barra de Herramientas) ---
export function DashboardControls({
  filters,
  setFilters,
  setCurrentPage,
  onOpenCreateOrderModal,
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

  return (
    // Contenedor principal de la barra de herramientas
    <div className="bg-white p-4 rounded-xl shadow mb-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Sección de Filtros */}
        <div className="flex flex-wrap items-center gap-3 w-full">
          <input
            type="text"
            placeholder="Buscar por cliente o teléfono..."
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
            className="border border-gray-300 rounded-lg p-2 text-sm flex-grow min-w-[200px] focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800"
          />
          {/* Aquí puedes añadir más filtros si lo deseas, como un select de estado */}
          <button 
            onClick={resetFilters} 
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Limpiar
          </button>
        </div>
        
        {/* Sección de Acciones */}
        <div className="w-full sm:w-auto flex-shrink-0">
          <button
            onClick={onOpenCreateOrderModal}
            className="w-full rounded-lg bg-neutral-900 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900"
          >
            + Crear Pedido
          </button>
        </div>
      </div>
    </div>
  );
}