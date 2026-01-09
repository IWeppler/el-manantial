"use client";

import { useMemo } from "react";
import { Formik, Form, FormikHelpers, Field } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { toast } from "react-hot-toast";
import clsx from "clsx";
import {
  Egg,
  ArrowUp,
  ArrowDown,
  Scale,
  DollarSign,
  Calendar,
  Layers,
  FileText,
  User,
  Plus,
} from "lucide-react"; // Usamos Lucide para consistencia con el resto del dashboard

import { OrderWithDetails } from "@/hooks/useDashboard";
import { EggProduction, Expense, ExpenseCategory } from "@prisma/client";
import { categoryOptions } from "@/lib/constants";

// --- TIPOS ---
type ProductionWithUser = EggProduction & { user?: { name: string | null } };
type ExpenseWithUser = Expense & { user?: { name: string | null } };
type HistoryItem = ProductionWithUser | ExpenseWithUser;

interface ProductionFormValues {
  date: string;
  quantity: string | number;
}

interface ExpenseFormValues {
  date: string;
  description: string;
  amount: string | number;
  category: ExpenseCategory | "";
}

// --- ESTILOS REUTILIZABLES (DARK) ---
const cardBg = "bg-[#18181b] border border-white/5 rounded-xl shadow-sm";
const inputClasses =
  "w-full bg-[#0f0f11] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-zinc-600";
const labelClasses = "block text-xs font-medium text-zinc-400 mb-1.5 ml-1";
const btnPrimaryClasses =
  "w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";

// --- COMPONENTES UI ADAPTADOS ---

const StatsCard = ({
  title,
  value,
  icon,
  colorClass,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass: string;
}) => (
  <div
    className={`${cardBg} p-5 flex items-center hover:border-white/10 transition-colors`}
  >
    <div className={`p-3 rounded-lg mr-4 ${colorClass}`}>{icon}</div>
    <div>
      <p className="text-sm font-medium text-zinc-400">{title}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
    </div>
  </div>
);

const HistoryTable = ({
  title,
  items,
}: {
  title: string;
  items: HistoryItem[];
}) => {
  const formatPrice = (price: number) =>
    price.toLocaleString("es-AR", { style: "currency", currency: "ARS" });

  return (
    <div className={`${cardBg} overflow-hidden flex flex-col h-full`}>
      <div className="p-4 border-b border-white/5 flex items-center gap-2">
        <div className="p-1.5 rounded bg-zinc-800 text-zinc-400">
          {title === "Historial de Producción" ? (
            <Egg size={16} />
          ) : (
            <FileText size={16} />
          )}
        </div>
        <h3 className="font-bold text-white text-sm">{title}</h3>
      </div>

      <div className="overflow-x-auto max-h-[400px] scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-zinc-900/50 text-xs uppercase text-zinc-500 font-medium sticky top-0 backdrop-blur-sm">
            <tr>
              <th className="px-4 py-3 border-b border-white/5">Fecha</th>
              <th className="px-4 py-3 border-b border-white/5">
                {title === "Historial de Producción"
                  ? "Cantidad"
                  : "Descripción"}
              </th>
              {title !== "Historial de Producción" && (
                <th className="px-4 py-3 border-b border-white/5 text-right">
                  Monto
                </th>
              )}
              <th className="px-4 py-3 border-b border-white/5 text-right">
                Registrado por
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="p-8 text-center text-zinc-500 text-xs"
                >
                  No hay registros aún.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.id}
                  className="group hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3 text-zinc-400">
                    {new Date(item.date).toLocaleDateString("es-AR", {
                      timeZone: "UTC",
                    })}
                  </td>
                  <td className="px-4 py-3 text-white font-medium">
                    {"quantity" in item
                      ? `${item.quantity} huevos`
                      : item.description}
                  </td>
                  {"amount" in item && (
                    <td className="px-4 py-3 text-right font-mono text-zinc-300">
                      {formatPrice(item.amount)}
                    </td>
                  )}
                  <td className="px-4 py-3 text-right text-zinc-500 text-xs">
                    <div className="flex items-center justify-end gap-1.5">
                      <User size={12} />
                      {item.user?.name?.split(" ")[0] || "Sistema"}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- VALIDACIONES ---
const productionValidation = Yup.object({
  date: Yup.date().required("Requerido"),
  quantity: Yup.number().positive("Mayor a 0").required("Requerido"),
});

const expenseValidation = Yup.object({
  date: Yup.date().required("Requerido"),
  description: Yup.string().min(3, "Mínimo 3 letras").required("Requerido"),
  amount: Yup.number().positive("Mayor a 0").required("Requerido"),
  category: Yup.string()
    .oneOf(Object.values(ExpenseCategory))
    .required("Requerido"),
});

// --- COMPONENTE PRINCIPAL ---

interface AnalyticsPanelProps {
  orders: OrderWithDetails[];
  production: ProductionWithUser[];
  expenses: ExpenseWithUser[];
  setProduction: React.Dispatch<React.SetStateAction<ProductionWithUser[]>>;
  setExpenses: React.Dispatch<React.SetStateAction<ExpenseWithUser[]>>;
}

export function AnalyticsPanel({
  orders,
  production,
  expenses,
  setProduction,
  setExpenses,
}: AnalyticsPanelProps) {
  // Cálculo de Métricas (Memoizado)
  const analytics = useMemo(() => {
    const totalEggsProduced = production.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    // Asumiendo 30 huevos por maple
    const validOrders = orders.filter((o) => o.status !== "CANCELADO");
    const totalEggsSold = validOrders.reduce(
      (sum, order) => sum + order.mapleQuantity * 30,
      0
    );

    const totalRevenue = validOrders.reduce(
      (sum, order) => sum + order.totalPrice,
      0
    );
    const totalExpenses = expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );

    return {
      totalEggsProduced,
      totalEggsSold,
      eggBalance: totalEggsProduced - totalEggsSold,
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
    };
  }, [orders, production, expenses]);

  const formatMoney = (val: number) =>
    val.toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    });

  // Handlers
  const handleAddProduction = async (
    values: ProductionFormValues,
    { resetForm }: FormikHelpers<ProductionFormValues>
  ) => {
    try {
      const res = await axios.post("/api/production", {
        ...values,
        quantity: Number(values.quantity),
      });
      setProduction((prev) => [res.data, ...prev]);
      toast.success("Producción registrada");
      resetForm();
    } catch (error) {
      toast.error("Error al registrar");
    }
  };

  const handleAddExpense = async (
    values: ExpenseFormValues,
    { resetForm }: FormikHelpers<ExpenseFormValues>
  ) => {
    try {
      const res = await axios.post("/api/expenses", {
        ...values,
        amount: Number(values.amount),
      });
      setExpenses((prev) => [res.data, ...prev]);
      toast.success("Gasto registrado");
      resetForm();
    } catch (error) {
      toast.error("Error al registrar");
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. KPIs Generales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard
          title="Huevos Producidos"
          value={analytics.totalEggsProduced.toLocaleString()}
          icon={<Egg size={20} />}
          colorClass="bg-yellow-500/10 text-yellow-500"
        />
        <StatsCard
          title="Huevos Vendidos"
          value={analytics.totalEggsSold.toLocaleString()}
          icon={<ArrowUp size={20} />}
          colorClass="bg-emerald-500/10 text-emerald-500"
        />
        <StatsCard
          title="Balance Stock"
          value={analytics.eggBalance.toLocaleString()}
          icon={<Scale size={20} />}
          colorClass="bg-blue-500/10 text-blue-500"
        />
        <StatsCard
          title="Ingresos Totales"
          value={formatMoney(analytics.totalRevenue)}
          icon={<DollarSign size={20} />}
          colorClass="bg-emerald-500/10 text-emerald-500"
        />
        <StatsCard
          title="Gastos Totales"
          value={formatMoney(analytics.totalExpenses)}
          icon={<ArrowDown size={20} />}
          colorClass="bg-red-500/10 text-red-500"
        />
        <StatsCard
          title="Ganancia Neta"
          value={formatMoney(analytics.netProfit)}
          icon={<Scale size={20} />}
          colorClass={
            analytics.netProfit >= 0
              ? "bg-blue-500/10 text-blue-500"
              : "bg-red-500/10 text-red-500"
          }
        />
      </div>

      {/* 2. Formularios de Carga */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Formulario Producción */}
        <div className={cardBg}>
          <div className="p-4 border-b border-white/5">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Egg size={16} className="text-yellow-500" /> Registrar Producción
              Diaria
            </h3>
          </div>
          <div className="p-5">
            <Formik<ProductionFormValues>
              initialValues={{
                date: new Date().toISOString().split("T")[0],
                quantity: "",
              }}
              validationSchema={productionValidation}
              onSubmit={handleAddProduction}
            >
              {({ isSubmitting, errors, touched }) => (
                <Form className="space-y-4">
                  <div>
                    <label className={labelClasses}>Fecha</label>
                    <div className="relative">
                      <Field name="date" type="date" className={inputClasses} />
                      <Calendar className="absolute right-3 top-2.5 text-zinc-500 w-4 h-4 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className={labelClasses}>Cantidad (Unidades)</label>
                    <Field
                      name="quantity"
                      type="number"
                      placeholder="Ej: 150"
                      className={inputClasses}
                    />
                    {errors.quantity && touched.quantity && (
                      <div className="text-red-400 text-xs mt-1">
                        {errors.quantity}
                      </div>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={btnPrimaryClasses}
                  >
                    {isSubmitting ? (
                      "Guardando..."
                    ) : (
                      <>
                        <Plus size={16} /> Registrar Producción
                      </>
                    )}
                  </button>
                </Form>
              )}
            </Formik>
          </div>
        </div>

        {/* Formulario Gastos */}
        <div className={cardBg}>
          <div className="p-4 border-b border-white/5">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <ArrowDown size={16} className="text-red-500" /> Registrar Nuevo
              Gasto
            </h3>
          </div>
          <div className="p-5">
            <Formik<ExpenseFormValues>
              initialValues={{
                date: new Date().toISOString().split("T")[0],
                description: "",
                amount: "",
                category: "",
              }}
              validationSchema={expenseValidation}
              onSubmit={handleAddExpense}
            >
              {({ isSubmitting, errors, touched }) => (
                <Form className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClasses}>Fecha</label>
                      <Field name="date" type="date" className={inputClasses} />
                    </div>
                    <div>
                      <label className={labelClasses}>Categoría</label>
                      <Field
                        as="select"
                        name="category"
                        className={inputClasses}
                      >
                        <option value="">Seleccionar...</option>
                        {categoryOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </Field>
                      {errors.category && touched.category && (
                        <div className="text-red-400 text-xs mt-1">
                          Requerido
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className={labelClasses}>Descripción</label>
                    <Field
                      name="description"
                      placeholder="Ej: Bolsa de maíz 50kg"
                      className={inputClasses}
                    />
                    {errors.description && touched.description && (
                      <div className="text-red-400 text-xs mt-1">
                        {errors.description}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className={labelClasses}>Monto ($)</label>
                    <Field
                      name="amount"
                      type="number"
                      placeholder="0.00"
                      className={inputClasses}
                    />
                    {errors.amount && touched.amount && (
                      <div className="text-red-400 text-xs mt-1">
                        {errors.amount}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={btnPrimaryClasses}
                  >
                    {isSubmitting ? (
                      "Guardando..."
                    ) : (
                      <>
                        <Plus size={16} /> Registrar Gasto
                      </>
                    )}
                  </button>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>

      {/* 3. Tablas de Historial */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full min-h-[400px]">
        <HistoryTable title="Historial de Producción" items={production} />
        <HistoryTable title="Historial de Gastos" items={expenses} />
      </div>
    </div>
  );
}
