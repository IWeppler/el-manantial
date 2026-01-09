import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { DashboardClient } from "@/components/DashboardClient";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== "ADMIN") {
    redirect("/");
  }

  const [orders, stock, settings, production, expenses, schedules] = await Promise.all([
    db.order.findMany({
      orderBy: { orderDate: "desc" },
      include: {
        user: true,     
        schedule: true, 
      },
    }),
    db.stock.findFirst(),
    db.settings.findFirst({
      include: { priceTiers: true },
    }),
    db.eggProduction.findMany({ 
      orderBy: { date: "desc" },
      include: { user: { select: { name: true } } }
    }),
    db.expense.findMany({ 
      orderBy: { date: "desc" },
      include: { user: { select: { name: true } } }
    }),
    db.schedule.findMany({ where: { isActive: true }, orderBy: { dayOfWeek: 'asc' } }),
  ]);

  if (!settings) {
    throw new Error("La configuración del negocio no ha sido inicializada.");
  }

  return (
    <DashboardClient
      initialOrders={orders}
      initialStock={stock}
      initialSettings={settings}
      initialProduction={production}
      initialExpenses={expenses}
      initialSchedules={schedules}
    />
  );
}
