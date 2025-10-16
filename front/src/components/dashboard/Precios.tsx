"use client";

import { OrderStatus, PaymentMethod, ScheduleType } from "@prisma/client";
import {
  FaWhatsapp,
  FaMoneyBillWave,
  FaCreditCard,
  FaCheckCircle,
} from "react-icons/fa";
import { OrderWithDetails } from "@/hooks/useDashboard";
import React from "react";
import { ShoppingBag, Truck } from "lucide-react";

// --- Tipos de Props ---
interface OrdersListProps {
  orders: OrderWithDetails[];
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  ordersPerPage: number;
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void;
}

// --- Componentes de UI Internos ---
const statusColors: { [key in OrderStatus]: string } = {
  PENDIENTE: "bg-yellow-100 text-yellow-800 border-yellow-300",
  CONFIRMADO: "bg-blue-100 text-blue-800 border-blue-300",
  ENTREGADO: "bg-green-100 text-green-800 border-green-300",
  CANCELADO: "bg-red-100 text-red-800 border-red-300",
};
const WhatsAppIcon = () => <FaWhatsapp size={22} />;
const PaymentIcon = ({ method }: { method: PaymentMethod }) =>
  method === "CASH" ? (
    <FaMoneyBillWave className="text-green-600" title="Efectivo" />
  ) : (
    <FaCreditCard className="text-blue-600" title="Transferencia" />
  );
const VerifiedBadge = () => (
  <span className="ml-2 text-blue-500" title="Cliente Registrado">
    <FaCheckCircle />
  </span>
);
const formatPrice = (price: number) =>
  price.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  });


  const DeliveryTypeBadge = ({ type }: { type: ScheduleType }) => {
  const isDelivery = type === ScheduleType.DELIVERY;

  const config = {
    label: isDelivery ? "Envío" : "Retiro",
    icon: isDelivery ? <Truck size={14} /> : <ShoppingBag size={14} />,
    className: isDelivery
      ? "bg-orange-100 text-orange-800"
      : "bg-green-100 text-green-800",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${config.className}`}>
      {config.icon}
      {config.label}
    </span>
  );
};

// --- AHORA: Sub-componente para la Fila de la Tabla ---
const OrderItemRow = ({
  order,
  index,
  onStatusChange,
}: {
  order: OrderWithDetails;
  index: number;
  onStatusChange: OrdersListProps["onStatusChange"];
}) => (
  <tr className={index % 2 === 0 ? "bg-white" : "bg-neutral-100"}>
    <td className="px-4 py-4 text-sm font-medium text-gray-500">{index + 1}</td>


    <td className="px-6 py-4">
      <div className="flex items-center text-sm font-medium text-gray-900">
        {order.user?.name || order.guestName}
        {order.user && <VerifiedBadge />}
      </div>
      <div className="text-sm text-gray-500">
        {order.user?.address || order.guestAddress || "No especificada"}
      </div>
    </td>

    <td className="px-6 py-4">
      {/* Usamos mapleQuantity en lugar de product.name */}
      <div className="text-sm text-gray-900">
        <strong>{order.mapleQuantity}</strong> maple(s)
      </div>
      <div className="text-sm font-bold text-gray-700">
        {formatPrice(order.totalPrice)}
      </div>
      {/* Mostramos el horario del pedido */}
      <div className="text-sm text-gray-500">
        {order.schedule.dayOfWeek} ({order.schedule.startTime} -{" "}
        {order.schedule.endTime})
      </div>
      <div className="mt-2">
        <DeliveryTypeBadge type={order.schedule.type} />
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="flex items-center justify-center gap-4">
        <a
          href={`https://wa.me/${order.user?.phone || order.guestPhone}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-600 hover:text-green-800"
        >
          <WhatsAppIcon />
        </a>
        <PaymentIcon method={order.paymentMethod} />
      </div>
    </td>
    <td className="px-6 py-4 text-sm">
      <select
        value={order.status}
        onChange={(e) =>
          onStatusChange(order.id, e.target.value as OrderStatus)
        }
        className={`rounded-md border py-1 px-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 ${
          statusColors[order.status]
        }`}
      >
        {Object.values(OrderStatus).map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
    </td>
  </tr>
);

// ---  Sub-componente para la Tarjeta Móvil ---
const OrderItemCard = ({
  order,
  onStatusChange,
}: {
  order: OrderWithDetails;
  onStatusChange: OrdersListProps["onStatusChange"];
}) => (
  <div className="bg-white rounded-lg shadow p-4">
    <div className="flex justify-between items-start">
      <div>
        <div className="flex items-center text-sm font-bold text-gray-900">
          {order.user?.name || order.guestName}
          {order.user && <VerifiedBadge />}
        </div>
        <p className="text-sm text-gray-500">
          {order.user?.address || order.guestAddress || "No especificada"}
        </p>
      </div>
      <p className="text-sm text-gray-500">
        {new Date(order.orderDate).toLocaleDateString("es-AR")}
      </p>
    </div>
    <div className="mt-3">
      {/* CORREGIDO: Usamos mapleQuantity en lugar de product.name */}
      <p className="text-sm text-gray-800">
        <strong>{order.mapleQuantity}</strong> maple(s)
      </p>
      <p className="text-lg font-bold text-gray-900">
        {formatPrice(order.totalPrice)}
      </p>
      {/* MEJORA: Mostramos el horario del pedido */}
      <p className="text-sm text-gray-500">
        {order.schedule.dayOfWeek} ({order.schedule.startTime} -{" "}
        {order.schedule.endTime})
      </p>
    </div>
    <div className="mt-2">
        <DeliveryTypeBadge type={order.schedule.type} />
      </div>
    <div className="mt-4 flex justify-between items-center border-t pt-4">
      <div className="flex items-center gap-4">
        <a
          href={`https://wa.me/${order.user?.phone || order.guestPhone}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-600"
        >
          <WhatsAppIcon />
        </a>
        <PaymentIcon method={order.paymentMethod} />
      </div>
      <select
        value={order.status}
        onChange={(e) =>
          onStatusChange(order.id, e.target.value as OrderStatus)
        }
        className={`rounded-md border shadow-sm text-sm font-semibold ${
          statusColors[order.status]
        }`}
      >
        {Object.values(OrderStatus).map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
    </div>
  </div>
);

// --- Componente Principal de la Lista (Ahora más limpio) ---
export function OrdersList({
  orders,
  currentPage,
  setCurrentPage,
  ordersPerPage,
  onStatusChange,
}: OrdersListProps) {
  const totalPages = Math.ceil(orders.length / ordersPerPage);
  const paginatedOrders = orders.slice(
    (currentPage - 1) * ordersPerPage,
    currentPage * ordersPerPage
  );

  return (
    <div className="px-4 sm:px-0">
      <div className="overflow-hidden rounded-lg shadow">
        {/* --- Vista de Tabla para Escritorio --- */}
        <div className="hidden md:block">
          <table className="min-w-full">
            <thead className="bg-neutral-800 text-white">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium uppercase tracking-wider">
                  Cliente / Dirección
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium uppercase tracking-wider">
                  Pedido
                </th>
                <th className="px-6 py-3 text-center text-sm font-medium uppercase tracking-wider">
                  Contacto / Pago
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.map((order, index) => (
                <OrderItemRow
                  key={order.id}
                  order={order}
                  index={(currentPage - 1) * ordersPerPage + index}
                  onStatusChange={onStatusChange}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* --- Vista de Tarjetas para Móvil --- */}
        <div className="md:hidden space-y-4 p-4 bg-neutral-100">
          {paginatedOrders.map((order) => (
            <OrderItemCard
              key={order.id}
              order={order}
              onStatusChange={onStatusChange}
            />
          ))}
        </div>
      </div>

      {/* --- Controles de Paginación --- */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-700">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
