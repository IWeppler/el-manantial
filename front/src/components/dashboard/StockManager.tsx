"use client";

import { useState } from "react";
import { Stock } from "@prisma/client";
import { toast } from "react-hot-toast";
import { Plus, Minus, ShoppingBag, Loader2 } from "lucide-react";

interface StockManagerProps {
  stock: Stock | null;
  onUpdateStock: (amount: number) => Promise<void>;
}

export function StockManager({ stock, onUpdateStock }: StockManagerProps) {
  const [amount, setAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const currentStock = stock?.mapleCount ?? 0;

  const handleSubmit = async (adjustment: number) => {
    const value = parseInt(amount);
    if (isNaN(value) || value <= 0) {
      toast.error("Por favor, ingresa una cantidad válida.");
      return;
    }

    setIsLoading(true);
    try {
      await onUpdateStock(value * adjustment);
      setAmount("");
      toast.success(adjustment > 0 ? "Stock agregado" : "Stock descontado");
    } catch (error) {
      // El toast de error ya suele manejarlo el padre o el interceptor, pero por las dudas:
      toast.error("Error al actualizar stock");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#18181b] rounded-xl border border-white/5 p-5 relative overflow-hidden group h-full flex flex-col justify-between">
      {/* Decoración de fondo */}
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <ShoppingBag size={80} />
      </div>

      <div>
        <h3 className="text-sm font-medium text-zinc-400 mb-1">
          Stock de Maples
        </h3>
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-4xl font-bold text-white tracking-tight">
            {currentStock}
          </span>
          <span className="text-sm text-zinc-500">unidades</span>
        </div>
      </div>

      <div className="space-y-3 mt-auto">
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isLoading}
            className="w-full bg-[#0f0f11] border border-white/10 rounded-lg pl-3 pr-10 py-2 text-sm text-white focus:border-indigo-500 outline-none placeholder:text-zinc-600"
            placeholder="0"
          />
          <span className="absolute right-3 top-2 text-xs text-zinc-500">
            cant.
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleSubmit(1)}
            disabled={isLoading || !amount}
            className="flex items-center justify-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="animate-spin w-3 h-3" />
            ) : (
              <Plus size={14} />
            )}
            Ingreso
          </button>

          <button
            onClick={() => handleSubmit(-1)}
            disabled={isLoading || !amount}
            className="flex items-center justify-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="animate-spin w-3 h-3" />
            ) : (
              <Minus size={14} />
            )}
            Egreso
          </button>
        </div>
      </div>
    </div>
  );
}
