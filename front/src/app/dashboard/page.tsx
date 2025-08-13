import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import DashboardClient from "../../components/DashboardClient";

export default async function DashboardPage() {
  // 1. Verificación de seguridad en el servidor
  const session = await getServerSession(authOptions);

  // Si no hay sesión o el rol no es ADMIN, lo redirigimos a la página principal
  if (session?.user?.role !== "ADMIN") {
    redirect("/");
  }

  // 2. Obtenemos todas las órdenes de la base de datos
  const [orders, stock] = await Promise.all([
    db.order.findMany({
      orderBy: { orderDate: 'desc' },
      include: { user: true, product: true },
    }),
    db.stock.findFirst(),
  ]);

  // Si no hay stock, creamos uno por si acaso (no debería pasar con el seed)
  const initialStockCount = stock?.mapleCount ?? 0;

  return <DashboardClient initialOrders={orders} initialStock={initialStockCount} />;
}
