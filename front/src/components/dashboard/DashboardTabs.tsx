"use client";

import clsx from "clsx";

interface DashboardTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const tabs = [
  { id: "pedidos", name: "Pedidos" },
  { id: "analisis", name: "Análisis y Producción" },
  { id: "reportes", name: "Reportes" },
  { id: "configuracion", name: "Configuración" },
];

export function DashboardTabs({ activeTab, setActiveTab }: DashboardTabsProps) {
  return (
    <div className="border-b border-gray-200 mb-6 px-4 sm:px-0">
      <nav className="-mb-px flex space-x-6 sm:space-x-8 overflow-x-auto" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "whitespace-nowrap py-4 px-2 border-b-2 font-medium text-sm focus:outline-none",
              activeTab === tab.id
                ? "border-neutral-800 text-neutral-900"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            {tab.name}
          </button>
        ))}
      </nav>
    </div>
  );
}