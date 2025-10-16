"use client";

import { useState } from "react";
import { Stock } from "@prisma/client";
import { toast } from "react-hot-toast";
import { FaPlusCircle, FaMinusCircle } from "react-icons/fa";

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
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-4 flex flex-col justify-between">
      <div>
        <h3 className="font-bold text-lg">Stock de Maples</h3>
        <p className="text-4xl font-bold text-gray-800 tracking-tight">
          {currentStock}
        </p>
      </div>
      <div className="mt-4 space-y-2">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={isLoading}
          className="w-full border-gray-300 rounded-md shadow-sm p-2 text-center text-lg focus:ring-primary focus:border-primary"
          placeholder="Cantidad"
        />
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleSubmit(1)}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 rounded-md bg-green-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-600 disabled:opacity-50 cursor-pointer"
          >
            <FaPlusCircle />
            {isLoading ? "Agregando..." : "Agregar"}
          </button>
          <button
            onClick={() => handleSubmit(-1)}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 rounded-md bg-red-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-600 disabled:opacity-50 cursor-pointer"
          >
            <FaMinusCircle />
            {isLoading ? "Quitando..." : "Quitar"}
          </button>
        </div>
      </div>
    </div>
  );
}