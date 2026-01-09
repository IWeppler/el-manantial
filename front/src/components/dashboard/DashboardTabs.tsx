"use client";

import clsx from "clsx";

interface DashboardTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const tabs = [
  { id: "pedidos", name: "Pedidos" },
  { id: "analisis", name: "Análisis" },
  { id: "reportes", name: "Reportes" },
  { id: "configuracion", name: "Configuración" },
];

export function DashboardTabs({ activeTab, setActiveTab }: DashboardTabsProps) {
  return (
    <nav className="flex items-center gap-1 bg-zinc-900/50 p-1 rounded-lg border border-white/5 mx-4 overflow-x-auto scrollbar-hide">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "px-4 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap",
              isActive
                ? "bg-zinc-800 text-white shadow-sm border border-white/5" // Estado Activo (Botón)
                : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5" // Estado Inactivo (Texto)
            )}
          >
            {tab.name}
          </button>
        );
      })}
    </nav>
  );
}
