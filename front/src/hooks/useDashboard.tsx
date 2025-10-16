import { useState, useMemo } from "react";
import { Order, User, Schedule } from "@prisma/client";

// Paso 1: Definir tipos correctos que usaremos en todo el dashboard
export type OrderWithDetails = Order & {
  user: User | null;
  schedule: Schedule;
};

// Paso 2: Definir la forma del estado de los filtros
export interface FiltersState {
  scheduleType: "ALL" | "DELIVERY" | "PICKUP";
  status: "ALL" | string;
  paymentMethod: "ALL" | string;
  searchTerm: string;
  dateRange: "ALL" | string;
}

// Paso 3: Definir las props que recibirá nuestro hook
interface UseDashboardLogicProps {
  initialOrders: OrderWithDetails[];
}

export const useDashboardLogic = ({ initialOrders }: UseDashboardLogicProps) => {
  const [orders, setOrders] = useState<OrderWithDetails[]>(initialOrders);

  const [filters, setFilters] = useState<FiltersState>({
    scheduleType: "ALL",
    status: "ALL",
    paymentMethod: "ALL",
    searchTerm: "",
    dateRange: "ALL",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  const filteredOrders = useMemo(() => {
    // Optimización: Calcular la fecha de inicio una sola vez
    let startDate: Date | null = null;
    if (filters.dateRange !== "ALL") {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0); // Para comparar desde el inicio del día
      startDate.setDate(startDate.getDate() - Number(filters.dateRange));
    }

    const searchTerm = filters.searchTerm.toLowerCase();

    return orders.filter((order) => {
      // Condición de Tipo de Horario
      const scheduleMatch = filters.scheduleType === "ALL" || order.schedule.type === filters.scheduleType;

      // Condición de Estado
      const statusMatch = filters.status === "ALL" || order.status === filters.status;

      // Condición de Método de Pago
      const paymentMethodMatch = filters.paymentMethod === "ALL" || order.paymentMethod === filters.paymentMethod;
      
      // Condición de Rango de Fechas (Optimizada)
      const dateMatch = !startDate || new Date(order.orderDate) >= startDate;

      // Condición de Búsqueda
      const customerName = (order.user?.name || order.guestName || "").toLowerCase();
      const customerPhone = (order.user?.phone || order.guestPhone || "").toLowerCase();
      const searchMatch = !searchTerm || customerName.includes(searchTerm) || customerPhone.includes(searchTerm);

      return scheduleMatch && statusMatch && paymentMethodMatch && dateMatch && searchMatch;
    });
  }, [orders, filters]);

  const stats = useMemo(() => {
    const relevantOrders = filteredOrders.filter((o) => o.status !== "CANCELADO");
    const totalSales = relevantOrders.reduce((sum, order) => sum + order.totalPrice, 0);
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

  return {
    orders,
    setOrders,
    filters,
    setFilters,
    filteredOrders,
    stats,
    currentPage,
    setCurrentPage,
    ordersPerPage,
  };
};