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
  PaymentMethod,
} from "@prisma/client";
import { signOut } from "next-auth/react";
import {
  FaWhatsapp,
  FaMoneyBillWave,
  FaCreditCard,
  FaBoxOpen,
  FaChartLine,
  FaUserFriends,
  FaDollarSign,
  FaPlusCircle,
  FaMinusCircle,
  FaCheckCircle,
} from "react-icons/fa";

type OrderWithDetails = Order & {
  user: User | null;
  product: Product;
};

interface DashboardClientProps {
  initialOrders: OrderWithDetails[];
  initialStock: number;
}

const statusColors: { [key in OrderStatus]: string } = {
  PENDIENTE: "bg-yellow-100 text-yellow-800 border-yellow-300",
  CONFIRMADO: "bg-blue-100 text-blue-800 border-blue-300",
  ENTREGADO: "bg-green-100 text-green-800 border-green-300",
  CANCELADO: "bg-red-100 text-red-800 border-red-300",
};

const WhatsAppIcon = () => <FaWhatsapp size={22} />;
const PaymentIcon = ({ method }: { method: PaymentMethod }) => {
  if (method === "EFECTIVO")
    return <FaMoneyBillWave className="text-green-600" title="Efectivo" />;
  return <FaCreditCard className="text-blue-600" title="Transferencia" />;
};

const StatsCard = ({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}) => (
  <div className="bg-white p-4 rounded-lg shadow flex items-center">
    <div className="bg-primary/10 text-primary p-3 rounded-full mr-4">
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

const VerifiedBadge = () => (
  <span className="ml-2 text-blue-500" title="Cliente Registrado">
    <FaCheckCircle />
  </span>
);

export default function DashboardClient({
  initialOrders,
}: DashboardClientProps) {
  const [orders, setOrders] = useState(initialOrders);
  const router = useRouter();

  const [deliveryFilter, setDeliveryFilter] = useState<DeliveryType | "ALL">(
    "ALL"
  );
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL");
  const [paymentFilter, setPaymentFilter] = useState<PaymentMethod | "ALL">(
    "ALL"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<"ALL" | "7" | "30" | "90" | "365">(
    "ALL"
  );
  const [stock, setStock] = useState(100);
  const [stockAdjustment, setStockAdjustment] = useState<number | "">("");

  const filteredOrders = useMemo(() => {
    return orders
      .filter(
        (order) =>
          deliveryFilter === "ALL" || order.deliveryType === deliveryFilter
      )
      .filter(
        (order) => statusFilter === "ALL" || order.status === statusFilter
      )
      .filter(
        (order) =>
          paymentFilter === "ALL" || order.paymentMethod === paymentFilter
      )
      .filter((order) => {
        if (dateRange === "ALL") return true;
        const orderDate = new Date(order.orderDate);
        const start = new Date();
        start.setDate(start.getDate() - Number(dateRange));
        return orderDate >= start;
      })
      .filter((order) => {
        if (!searchTerm) return true;
        const customerName = (
          order.user?.name ||
          order.guestName ||
          ""
        ).toLowerCase();
        const customerPhone = (
          order.user?.phone ||
          order.guestPhone ||
          ""
        ).toLowerCase();
        return (
          customerName.includes(searchTerm.toLowerCase()) ||
          customerPhone.includes(searchTerm.toLowerCase())
        );
      });
  }, [
    orders,
    deliveryFilter,
    statusFilter,
    paymentFilter,
    dateRange,
    searchTerm,
  ]);

  const resetFilters = () => {
    setDeliveryFilter("ALL");
    setStatusFilter("ALL");
    setPaymentFilter("ALL");
    setSearchTerm("");
    setDateRange("ALL");
    setCurrentPage(1);
  };

  const formatPrice = (priceInCents: number) => {
    return (priceInCents / 100).toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    });
  };

  const stats = useMemo(() => {
    const relevantOrders = filteredOrders.filter(
      (o) => o.status !== "CANCELADO"
    );
    const totalSales = relevantOrders.reduce(
      (sum, order) => sum + order.totalPrice,
      0
    );
    const totalOrders = relevantOrders.length;
    const uniqueCustomers = new Set(
      relevantOrders.map((o) => o.user?.phone || o.guestPhone)
    ).size;
    return {
      totalSales,
      totalOrders,
      avgTicket: totalOrders > 0 ? totalSales / totalOrders : 0,
      uniqueCustomers,
    };
  }, [filteredOrders]);

  const dailySummary = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todaysOrders = orders.filter((o) => {
      const orderDate = new Date(o.orderDate);
      const isToday = orderDate >= today && orderDate <= endOfToday;
      const isRelevantStatus =
        o.status === "PENDIENTE" || o.status === "CONFIRMADO";
      return isToday && isRelevantStatus;
    });

    return {
      deliveries: todaysOrders.filter(
        (o) => o.deliveryType === "ENVIO_A_DOMICILIO"
      ).length,
      pickups: todaysOrders.filter((o) => o.deliveryType === "RETIRO_EN_LOCAL")
        .length,
      cash: todaysOrders
        .filter((o) => o.paymentMethod === "EFECTIVO")
        .reduce((sum, o) => sum + o.totalPrice, 0),
      transfer: todaysOrders
        .filter((o) => o.paymentMethod === "TRANSFERENCIA")
        .reduce((sum, o) => sum + o.totalPrice, 0),
    };
  }, [orders]);

  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const currentOrders = filteredOrders.slice(
    (currentPage - 1) * ordersPerPage,
    currentPage * ordersPerPage
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
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Error al actualizar el estado del pedido.");
    }
  };

  const handleStockChange = (amount: number) => {
    if (typeof amount !== "number" || isNaN(amount)) return;
    setStock((prevStock) => Math.max(0, prevStock + amount));
    setStockAdjustment("");
  };

  return (
    <div className="min-h-screen bg-neutral-100">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            Panel de Administración
          </h1>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="top-6 right-6 z-20 block rounded-full bg-neutral-950 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary cursor-pointer"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard
              title="Ventas Totales"
              value={formatPrice(stats.totalSales)}
              icon={<FaDollarSign size={24} />}
            />
            <StatsCard
              title="Pedidos"
              value={stats.totalOrders}
              icon={<FaBoxOpen size={24} />}
            />
            <StatsCard
              title="Ticket Promedio"
              value={formatPrice(stats.avgTicket)}
              icon={<FaChartLine size={24} />}
            />
            <StatsCard
              title="Clientes"
              value={stats.uniqueCustomers}
              icon={<FaUserFriends size={24} />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow">
              <h3 className="font-bold text-lg mb-4">Filtros de Búsqueda</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Buscar por cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border border-gray-300 rounded-md p-1"
                />

                {/* Select para rangos de fechas */}
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
                  className="border border-gray-300 rounded-md p-1"
                >
                  <option value="ALL">Todas las Fechas</option>
                  <option value="7">Últimos 7 días</option>
                  <option value="30">Últimos 30 días</option>
                  <option value="90">Últimos 90 días</option>
                  <option value="365">Últimos 12 meses</option>
                </select>

                <select
                  value={deliveryFilter}
                  onChange={(e) =>
                    setDeliveryFilter(e.target.value as DeliveryType | "ALL")
                  }
                  className="border border-gray-300 rounded-md p-1"
                >
                  <option value="ALL">Todos los Tipos</option>
                  <option value="ENVIO_A_DOMICILIO">Envíos</option>
                  <option value="RETIRO_EN_LOCAL">Retiros</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as OrderStatus | "ALL")
                  }
                  className="border border-gray-300 rounded-md p-1"
                >
                  <option value="ALL">Todos los Estados</option>
                  {Object.values(OrderStatus).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                <select
                  value={paymentFilter}
                  onChange={(e) =>
                    setPaymentFilter(e.target.value as PaymentMethod | "ALL")
                  }
                  className="border-gray-300 rounded-md shadow-sm"
                >
                  <option value="ALL">Todos los Pagos</option>
                  {Object.values(PaymentMethod).map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={resetFilters}
                className="mt-4 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 cursor-pointer"
              >
                Limpiar Filtros
              </button>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-bold text-lg mb-4">Resumen para Hoy</h3>
                <div className="space-y-2 text-sm">
                    <p><strong>Envíos:</strong> {dailySummary.deliveries}</p>
                    <p><strong>Retiros:</strong> {dailySummary.pickups}</p>
                    <p><strong>A cobrar (Efectivo):</strong> {formatPrice(dailySummary.cash)}</p>
                    <p><strong>A verificar (Transf.):</strong> {formatPrice(dailySummary.transfer)}</p>
                </div>
                <h3 className="font-bold text-lg mt-4 mb-2">Stock de Maples</h3>
                <div className="flex items-center gap-2">
                    <p className="font-bold text-xl mr-2">{stock}</p>
                    <input 
                      type="number" 
                      value={stockAdjustment || ''} 
                      onChange={(e) => setStockAdjustment(parseInt(e.target.value, 10) || '')} 
                      className="w-20 border-gray-300 rounded-md shadow-sm p-1 text-center"
                      placeholder="Cant."
                    />
                    <button onClick={() => handleStockChange(Number(stockAdjustment))} className="bg-green-500 text-white rounded-full p-2 hover:bg-green-600"><FaPlusCircle/></button>
                    <button onClick={() => handleStockChange(-Number(stockAdjustment))} className="bg-red-500 text-white rounded-full p-2 hover:bg-red-600"><FaMinusCircle/></button>
                </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg shadow">
            <div className="hidden md:block">
              <table className="min-w-full">
                <thead className="bg-neutral-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">#</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Cliente / Dirección</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Pedido</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">Contacto / Pago</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {currentOrders.map((order, index) => (
                    <tr
                      key={order.id}
                      className={
                        index % 2 === 0 ? "bg-white" : "bg-neutral-200"
                      }
                    >
                      <td className="px-4 py-4 text-sm font-medium text-gray-500">
                        {(currentPage - 1) * ordersPerPage + index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm font-medium text-gray-900">
                          {order.user?.name || order.guestName}
                          {order.user && <VerifiedBadge />}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.user?.address ||
                            order.guestAddress ||
                            "No especificada"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {order.product.name}
                        </div>
                        <div className="text-sm font-bold text-gray-700">
                          {formatPrice(order.totalPrice)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-4">
                          <a
                            href={`https://wa.me/${
                              order.user?.phone || order.guestPhone
                            }`}
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

            <div className="md:hidden space-y-4">
              {currentOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center text-sm font-bold text-gray-900">
                        {order.user?.name || order.guestName}
                        {order.user && <VerifiedBadge />}
                      </div>
                      <p className="text-xs text-gray-500">
                        {order.user?.address ||
                          order.guestAddress ||
                          "No especificada"}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(order.orderDate).toLocaleDateString("es-AR")}
                    </p>
                  </div>
                  <div className="mt-3">
                    <p className="text-sm text-gray-800">
                      {order.product.name}
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatPrice(order.totalPrice)}
                    </p>
                  </div>
                  <div className="mt-4 flex justify-between items-center border-t pt-4">
                    <div className="flex items-center gap-4">
                      <a
                        href={`https://wa.me/${
                          order.user?.phone || order.guestPhone
                        }`}
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
          </div>

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
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
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
