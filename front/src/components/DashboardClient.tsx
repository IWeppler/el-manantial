// src/components/DashboardClient.tsx
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Order,
  User,
  Product,
  OrderStatus,
  DeliveryType,
} from "@prisma/client";
import { LogoutButton } from "./ui/Buttons";
import { FaWhatsapp } from "react-icons/fa";

// Extendemos el tipo Order para incluir las relaciones
type OrderWithDetails = Order & {
  user: User | null;
  product: Product;
};

interface DashboardClientProps {
  initialOrders: OrderWithDetails[];
}

// Mapeo de colores para los estados de la orden
const statusColors: { [key in OrderStatus]: string } = {
  PENDIENTE: "bg-yellow-100 text-yellow-800 border-yellow-300",
  CONFIRMADO: "bg-blue-100 text-blue-800 border-blue-300",
  ENTREGADO: "bg-green-100 text-green-800 border-green-300",
  CANCELADO: "bg-red-100 text-red-800 border-red-300",
};

// Icono de WhatsApp como un componente SVG para reutilizar
const WhatsAppIcon = () => <FaWhatsapp />;

export default function DashboardClient({
  initialOrders,
}: DashboardClientProps) {
  const [orders, setOrders] = useState(initialOrders);
  const router = useRouter();

  // --- Lógica de Filtros ---
  const [filter, setFilter] = useState<DeliveryType | "ALL">("ALL");

  const filteredOrders = useMemo(() => {
    if (filter === "ALL") return orders;
    return orders.filter((order) => order.deliveryType === filter);
  }, [orders, filter]);

  // --- Lógica de Paginación ---
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(
    indexOfFirstOrder,
    indexOfLastOrder
  );

  const handleStatusChange = async (
    orderId: string,
    newStatus: OrderStatus
  ) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error("No se pudo actualizar el estado.");

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Error al actualizar el estado del pedido.");
    }
  };

  const formatPrice = (priceInCents: number) => {
    return (priceInCents / 100).toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    });
  };

  const FilterButton = ({
    value,
    label,
  }: {
    value: DeliveryType | "ALL";
    label: string;
  }) => (
    <button
      onClick={() => setFilter(value)}
      className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
        filter === value
          ? "bg-neutral-900 text-white"
          : "bg-white text-neutral-700 hover:bg-neutral-100"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-neutral-100">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            Panel de Administración
          </h1>
          <LogoutButton />
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* --- Filtros --- */}
          <div className="mb-6 flex items-center gap-2">
            <FilterButton value="ALL" label="Todos los Pedidos" />
            <FilterButton value="ENVIO_A_DOMICILIO" label="Envíos" />
            <FilterButton value="RETIRO_EN_LOCAL" label="Retiros" />
          </div>

          {/* --- Vista de Tabla para Escritorio --- */}
          <div className="hidden md:block overflow-x-auto rounded-lg shadow">
            <table className="min-w-full">
              <thead className="bg-neutral-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Pedido
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentOrders.map((order, index) => (
                  <tr
                    key={order.id}
                    className={index % 2 === 0 ? "bg-white" : "bg-neutral-100"}
                  >
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                      {indexOfFirstOrder + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.user?.name || order.guestName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.user?.address || "No especificada"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.product.name}
                      </div>
                      <div className="text-sm font-bold text-gray-700">
                        {formatPrice(order.totalPrice)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a
                        href={`https://wa.me/${
                          order.user?.phone || order.guestPhone
                        }`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-2xl font-semibold text-green-600 hover:text-green-800 transition-colors"
                      >
                        <WhatsAppIcon />
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <select
                        value={order.status}
                        onChange={(e) =>
                          handleStatusChange(
                            order.id,
                            e.target.value as OrderStatus
                          )
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
                ))}
              </tbody>
            </table>
          </div>

          {/* --- Vista de Tarjetas para Móvil --- */}
          <div className="md:hidden space-y-4">
            {currentOrders.map((order, index) => (
              <div
                key={order.id}
                className={`rounded-lg shadow p-4 ${
                  index % 2 === 0 ? "bg-white" : "bg-neutral-200"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      {order.user?.name || order.guestName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {order.user?.address || "No especificada"}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(order.orderDate).toLocaleDateString("es-AR")}
                  </p>
                </div>
                <div className="mt-3">
                  <p className="text-sm text-gray-800">{order.product.name}</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatPrice(order.totalPrice)}
                  </p>
                </div>
                <div className="mt-4 flex justify-between items-center border-t pt-4">
                  <a
                    href={`https://wa.me/${
                      order.user?.phone || order.guestPhone
                    }`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-green-600 hover:text-green-800 font-semibold"
                  >
                    <WhatsAppIcon />
                  </a>
                  <select
                    value={order.status}
                    onChange={(e) =>
                      handleStatusChange(
                        order.id,
                        e.target.value as OrderStatus
                      )
                    }
                    className={`rounded-md border shadow-sm text-xs font-semibold ${
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
            ))}
          </div>

          {/* --- Controles de Paginación --- */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-700">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
