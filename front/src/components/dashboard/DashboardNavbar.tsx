"use client";

import Image from "next/image";
import { UserNav } from "./UserNav";
import { DashboardTabs } from "./DashboardTabs";
import { Session } from "next-auth";

interface DashboardNavbarProps {
  user: Session["user"];
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function DashboardNavbar({
  user,
  activeTab,
  setActiveTab,
}: DashboardNavbarProps) {
  return (
    <header className="border-b border-white/5 bg-[#18181b]/80 backdrop-blur-md sticky top-0 z-30 flex flex-col md:h-16 justify-center">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 py-3 md:py-0 flex flex-col md:flex-row justify-between items-center gap-3">
        {/* FILA SUPERIOR: Logo y Usuario */}
        <div className="flex w-full md:w-auto justify-between items-center">
          <div className="flex items-center gap-3 shrink-0">
            <Image
              src="/logo.jpg"
              alt="Logo"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <h1 className="text-sm font-bold tracking-wide text-zinc-300 uppercase md:block">
              Panel de Control
            </h1>
          </div>
          <div className="md:hidden">
            <UserNav user={user} />
          </div>
        </div>

        <div className="w-full md:w-auto flex justify-center overflow-x-auto pb-1 md:pb-0">
          <DashboardTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>

        <div className="hidden md:block shrink-0">
          <UserNav user={user} />
        </div>
      </div>
    </header>
  );
}
