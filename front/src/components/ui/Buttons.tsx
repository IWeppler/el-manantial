"use client";

import { signOut } from "next-auth/react"; // 1. Importa signOut

export const LogoutButton = () => {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="absolute top-6 right-6 z-20 block rounded-full bg-neutral-950 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary cursor-pointer"
    >
      Cerrar Sesión
    </button>
  );
};
