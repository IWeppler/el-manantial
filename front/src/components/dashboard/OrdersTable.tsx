"use client";

import { useState, useMemo } from "react";
import {
  Calendar,
  MessageCircle,
  Banknote,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  User,
  Loader2,
} from "lucide-react";
import { OrderWithDetails } from "@/hooks/useDashboard";
import { OrderStatus, PaymentMethod } from "@prisma/client";
import { toast } from "react-hot-toast";
import axios from "axios";

// --- INTERFACES PARA PROPS ---
interface OrdersTableProps {
  orders: OrderWithDetails[];
  onStatusChange?: (orderId: string, newStatus: OrderStatus) => void;
}

interface CommonRowProps {
  order: OrderWithDetails;
  formatMoney: (val: number) => string;
  formatDate: (date: Date | string) => string;
  isUpdating: boolean;
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void;
}

interface DesktopRowProps extends CommonRowProps {
  idx: number;
}

const ITEMS_PER_PAGE = 10;

export function OrdersTable({ orders, onStatusChange }: OrdersTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // --- LÓGICA DE ACTUALIZACIÓN ---
  const handleStatusUpdate = async (
    orderId: string,
    newStatus: OrderStatus
  ) => {
    setUpdatingId(orderId);
    try {
      await axios.patch(`/api/orders/${orderId}`, { status: newStatus });
      toast.success(`Estado actualizado`);

      if (onStatusChange) {
        onStatusChange(orderId, newStatus);
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al actualizar estado");
    } finally {
      setUpdatingId(null);
    }
  };

  const totalPages = Math.ceil(orders.length / ITEMS_PER_PAGE);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return orders.slice(start, end);
  }, [orders, currentPage]);

  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1);
  }

  // Helpers
  const formatMoney = (val: number) =>
    val.toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    });

  const formatDate = (d: Date | string) =>
    new Date(d).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
    });

  if (!orders || orders.length === 0) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center text-zinc-500">
        <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mb-4">
          <Calendar size={24} className="opacity-50" />
        </div>
        <p>No se encontraron pedidos.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* --- DESKTOP --- */}
      <div className="hidden md:block w-full overflow-x-auto flex-grow">
        <table className="w-full text-left border-collapse">
          <thead className="bg-zinc-900/50 text-xs uppercase text-zinc-500 font-medium">
            <tr>
              <th className="px-6 py-4 border-b border-white/5 w-16 text-center">
                #
              </th>
              <th className="px-6 py-4 border-b border-white/5">Cliente</th>
              <th className="px-6 py-4 border-b border-white/5">Detalle</th>
              <th className="px-6 py-4 border-b border-white/5">Entrega</th>
              <th className="px-6 py-4 border-b border-white/5">Pago</th>
              <th className="px-6 py-4 border-b border-white/5 text-right">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm">
            {paginatedOrders.map((order, idx) => (
              <DesktopRow
                key={order.id}
                order={order}
                idx={(currentPage - 1) * ITEMS_PER_PAGE + idx}
                formatMoney={formatMoney}
                formatDate={formatDate}
                isUpdating={updatingId === order.id}
                onStatusChange={handleStatusUpdate}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* --- MOBILE --- */}
      <div className="md:hidden flex flex-col divide-y divide-white/5">
        {paginatedOrders.map((order) => (
          <MobileCard
            key={order.id}
            order={order}
            formatMoney={formatMoney}
            formatDate={formatDate}
            isUpdating={updatingId === order.id}
            onStatusChange={handleStatusUpdate}
          />
        ))}
      </div>

      {/* --- FOOTER PAGINACIÓN --- */}
      {totalPages > 1 && (
        <div className="border-t border-white/5 p-4 flex items-center justify-between bg-zinc-900/30 sticky bottom-0 backdrop-blur-md">
          <div className="text-xs text-zinc-500 hidden sm:block">
            Mostrando{" "}
            <span className="font-medium text-white">
              {(currentPage - 1) * ITEMS_PER_PAGE + 1}
            </span>{" "}
            a{" "}
            <span className="font-medium text-white">
              {Math.min(currentPage * ITEMS_PER_PAGE, orders.length)}
            </span>{" "}
            de <span className="font-medium text-white">{orders.length}</span>
          </div>
          <div className="flex items-center gap-2 mx-auto sm:mx-0">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 disabled:opacity-50 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-zinc-400 px-2">
              Pág <span className="text-white font-medium">{currentPage}</span>{" "}
              / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 disabled:opacity-50 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENTES ---

function StatusSelector({
  status,
  isUpdating,
  onChange,
}: {
  status: OrderStatus;
  isUpdating: boolean;
  onChange: (s: OrderStatus) => void;
}) {
  const styles: Record<OrderStatus, string> = {
    PENDIENTE:
      "text-yellow-500 bg-yellow-500/10 border-yellow-500/20 hover:bg-yellow-500/20",
    CONFIRMADO:
      "text-blue-400 bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20",
    ENTREGADO:
      "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20",
    CANCELADO:
      "text-red-500 bg-red-500/10 border-red-500/20 hover:bg-red-500/20",
  };

  if (isUpdating) {
    return (
      <div className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-zinc-800 border border-white/10 text-zinc-400">
        <Loader2 size={12} className="animate-spin mr-2" />
      </div>
    );
  }

  return (
    <div className="relative inline-block">
      <select
        value={status}
        onChange={(e) => onChange(e.target.value as OrderStatus)}
        className={`appearance-none cursor-pointer outline-none pl-3 pr-8 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border transition-colors ${
          styles[status] || styles.PENDIENTE
        } focus:ring-1 focus:ring-white/20`}
      >
        <option value="PENDIENTE" className="bg-[#18181b] text-yellow-500">
          Pendiente
        </option>
        <option value="CONFIRMADO" className="bg-[#18181b] text-blue-400">
          Confirmado
        </option>
        <option value="ENTREGADO" className="bg-[#18181b] text-emerald-400">
          Entregado
        </option>
        <option value="CANCELADO" className="bg-[#18181b] text-red-500">
          Cancelado
        </option>
      </select>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
        <svg
          width="8"
          height="6"
          viewBox="0 0 8 6"
          fill="currentColor"
          className={
            status === "PENDIENTE"
              ? "text-yellow-500"
              : status === "ENTREGADO"
              ? "text-emerald-400"
              : "text-zinc-400"
          }
        >
          <path d="M4 6L0 0H8L4 6Z" />
        </svg>
      </div>
    </div>
  );
}

function PaymentIcons({
  method,
  phone,
}: {
  method: PaymentMethod;
  phone?: string | null;
}) {
  return (
    <div className="flex gap-2">
      {phone && (
        <a
          href={`https://wa.me/${phone}`}
          target="_blank"
          rel="noreferrer"
          className="w-8 h-8 rounded bg-[#0f0f11] border border-white/10 flex items-center justify-center text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-all"
        >
          <MessageCircle size={15} />
        </a>
      )}
      <div
        className={`w-8 h-8 rounded border flex items-center justify-center ${
          method === PaymentMethod.CASH
            ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-500"
            : "bg-blue-500/5 border-blue-500/20 text-blue-500"
        }`}
        title={method === PaymentMethod.CASH ? "Efectivo" : "Transferencia"}
      >
        <Banknote size={15} />
      </div>
    </div>
  );
}

function DesktopRow({
  order,
  idx,
  formatMoney,
  formatDate,
  isUpdating,
  onStatusChange,
}: DesktopRowProps) {
  const clientName = order.user?.name || order.guestName || "Anónimo";
  const clientAddress =
    order.user?.address || order.guestAddress || "Sin dirección";
  const clientPhone = order.user?.phone || order.guestPhone;

  return (
    <tr className="group hover:bg-white/[0.02] transition-colors">
      <td className="px-6 py-4 text-center text-zinc-600 font-mono">
        {(idx + 1).toString().padStart(2, "0")}
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col">
          <span className="text-zinc-200 font-medium">{clientName}</span>
          <div className="flex items-center gap-1 mt-1 text-zinc-500 text-xs">
            <MapPin size={10} />{" "}
            <span className="truncate max-w-[150px]">{clientAddress}</span>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-zinc-300 font-medium">
              {order.mapleQuantity} Maples
            </span>
            <span className="text-emerald-400 font-bold text-xs bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              {formatMoney(order.totalPrice)}
            </span>
          </div>
          <div className="text-xs text-zinc-500">
            {formatDate(order.orderDate)}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-xs text-zinc-400">
        <div className="flex items-center gap-1">
          <Clock size={12} className="text-indigo-400" />
          <span>{order.schedule?.dayOfWeek}</span>
          <span className="text-zinc-600">|</span>
          <span>{order.schedule?.startTime}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <PaymentIcons method={order.paymentMethod} phone={clientPhone} />
      </td>
      <td className="px-6 py-4 text-right">
        <StatusSelector
          status={order.status}
          isUpdating={isUpdating}
          onChange={(newStatus) => onStatusChange(order.id, newStatus)}
        />
      </td>
    </tr>
  );
}

function MobileCard({
  order,
  formatMoney,
  formatDate,
  isUpdating,
  onStatusChange,
}: CommonRowProps) {
  const clientName = order.user?.name || order.guestName || "Anónimo";
  const clientAddress =
    order.user?.address || order.guestAddress || "Sin dirección";
  const clientPhone = order.user?.phone || order.guestPhone;

  return (
    <div className="p-4 flex flex-col gap-3 hover:bg-white/[0.02]">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
            <User size={18} />
          </div>
          <div>
            <p className="text-white font-medium text-sm">{clientName}</p>
            <p className="text-zinc-500 text-xs flex items-center gap-1">
              <MapPin size={10} /> {clientAddress}
            </p>
          </div>
        </div>
        <StatusSelector
          status={order.status}
          isUpdating={isUpdating}
          onChange={(newStatus) => onStatusChange(order.id, newStatus)}
        />
      </div>

      <div className="bg-black/20 p-3 rounded-lg border border-white/5 flex justify-between items-center">
        <div>
          <p className="text-zinc-300 text-sm">
            <span className="text-white font-bold">{order.mapleQuantity}</span>{" "}
            Maples
          </p>
          <div className="text-zinc-500 text-xs mt-0.5 flex items-center gap-1">
            <Clock size={10} /> {order.schedule?.dayOfWeek} (
            {order.schedule?.startTime})
          </div>
        </div>
        <div className="text-right">
          <p className="text-emerald-400 font-bold text-lg">
            {formatMoney(order.totalPrice)}
          </p>
          <p className="text-zinc-600 text-[10px]">
            {formatDate(order.orderDate)}
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center pt-1">
        <div className="flex gap-2">
          <PaymentIcons method={order.paymentMethod} phone={clientPhone} />
        </div>
        <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
          {order.schedule?.type === "DELIVERY"
            ? "Envío a Domicilio"
            : "Retiro en Local"}
        </span>
      </div>
    </div>
  );
}
