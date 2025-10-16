"use client";
import { OrderWithDetails } from "@/hooks/useDashboard";
import { EggProduction, Expense } from "@prisma/client";
import { useMemo } from "react";
import { FaEgg, FaArrowUp, FaArrowDown, FaBalanceScale, FaUserCircle } from "react-icons/fa";
import { Formik, Form, FormikHelpers } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { toast } from "react-hot-toast";
import { CustomInput } from "../ui/Input";
import clsx from "clsx";


type ProductionWithUser = EggProduction & { user?: { name: string | null } };
type ExpenseWithUser = Expense & { user?: { name: string | null } };
type HistoryItem = ProductionWithUser | ExpenseWithUser;


// (Puedes mover este componente StatsCard a un archivo compartido si lo usas en varios lugares)
const StatsCard = ({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode; }) => (
    <div className="bg-white p-4 rounded-lg shadow flex items-center">
        <div className="p-3 rounded-full mr-4 bg-gray-100">{icon}</div>
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
    </div>
);

const formatPrice = (price: number) => price.toLocaleString("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0, });

const HistoryTable = ({ title, items }: { title: string, items: HistoryItem[] }) => (
    <div className="bg-white p-4 rounded-lg shadow">
    <h3 className="font-bold text-lg mb-4">{title}</h3>
    <div className="overflow-x-auto max-h-96">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100 sticky top-0">
          <tr>
            <th className="p-3 text-left font-semibold text-gray-600">Fecha</th>
            <th className="p-3 text-left font-semibold text-gray-600">{title === "Historial de Producción" ? "Cantidad" : "Descripción"}</th>
            {title !== "Historial de Producción" && <th className="p-3 text-right font-semibold text-gray-600">Monto</th>}
            <th className="p-3 text-left font-semibold text-gray-600">Registrado por</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.id} className={clsx("border-t", index % 2 === 1 && "bg-gray-50")}>
              <td className="p-3 text-gray-700">{new Date(item.date).toLocaleDateString('es-AR')}</td>
              <td className="p-3 text-gray-700">
                {'quantity' in item ? item.quantity : item.description}
              </td>
              {'amount' in item && item.amount && (
                <td className="p-3 text-right font-semibold text-gray-800">
                  {formatPrice(item.amount)}
                </td>
              )}
              <td className="p-3 text-gray-500 flex items-center gap-2"><FaUserCircle />{item.user?.name ?? 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// --- PROPS Y LÓGICA DEL PANEL ---
interface AnalyticsPanelProps {
  orders: OrderWithDetails[];
  production: ProductionWithUser[];
  expenses: ExpenseWithUser[];
  setProduction: React.Dispatch<React.SetStateAction<ProductionWithUser[]>>;
  setExpenses: React.Dispatch<React.SetStateAction<ExpenseWithUser[]>>;
}

interface ProductionFormValues {
  date: string;
  quantity: string | number;
}

interface ExpenseFormValues {
  date: string;
  description: string;
  amount: string | number;
}

// Esquemas de validación con Yup
const productionValidation = Yup.object({
  date: Yup.date().required("La fecha es requerida."),
  quantity: Yup.number().positive("Debe ser mayor a 0.").required("La cantidad es requerida."),
});

const expenseValidation = Yup.object({
  date: Yup.date().required("La fecha es requerida."),
  description: Yup.string().min(3, "Mínimo 3 caracteres.").required("La descripción es requerida."),
  amount: Yup.number().positive("Debe ser mayor a 0.").required("El monto es requerido."),
});

export function AnalyticsPanel({ orders, production, expenses, setProduction, setExpenses }: AnalyticsPanelProps) { 
    const analytics = useMemo(() => {
    const totalEggsProduced = production.reduce((sum, item) => sum + item.quantity, 0);
    
    const validOrders = orders.filter(o => o.status !== "CANCELADO");
    const totalEggsSold = validOrders.reduce((sum, order) => sum + (order.mapleQuantity * 30), 0);
    
    const totalRevenue = validOrders.reduce((sum, order) => sum + order.totalPrice, 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    return {
      totalEggsProduced,
      totalEggsSold,
      eggBalance: totalEggsProduced - totalEggsSold,
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
    };
  }, [orders, production, expenses]);



  const handleAddProduction = async (
    values: ProductionFormValues,
    { resetForm }: FormikHelpers<ProductionFormValues>
  ) => {
    try {
      const dataToSend = {
        ...values,
        quantity: Number(values.quantity),
      };
      const response = await axios.post("/api/production", dataToSend);
      
      setProduction(prev => [response.data, ...prev]);
      toast.success("Producción registrada con éxito.");
      resetForm();
    } catch (error) {
      toast.error("Error al registrar la producción.");
      console.error(error);
    }
  };

  const handleAddExpense = async (
    values: ExpenseFormValues,
    { resetForm }: FormikHelpers<ExpenseFormValues>
  ) => {
    try {
      const dataToSend = {
        ...values,
        amount: Number(values.amount),
      };
      const response = await axios.post("/api/expenses", dataToSend);

      setExpenses(prev => [response.data, ...prev]);
      toast.success("Gasto registrado con éxito.");
      resetForm();
    } catch (error) {
      toast.error("Error al registrar el gasto.");
      console.error(error);
    }
  };

  return (
    <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatsCard title="Huevos Producidos" value={analytics.totalEggsProduced.toLocaleString()} icon={<FaEgg size={24} className="text-yellow-500" />} />
            <StatsCard title="Huevos Vendidos" value={analytics.totalEggsSold.toLocaleString()} icon={<FaArrowUp size={24} className="text-green-500" />} />
            <StatsCard title="Balance de Huevos" value={analytics.eggBalance.toLocaleString()} icon={<FaBalanceScale size={24} className="text-blue-500" />} />
            <StatsCard title="Ingresos Totales" value={formatPrice(analytics.totalRevenue)} icon={<FaArrowUp size={24} className="text-green-500" />} />
            <StatsCard title="Gastos Totales" value={formatPrice(analytics.totalExpenses)} icon={<FaArrowDown size={24} className="text-red-500" />} />
            <StatsCard title="Ganancia Neta" value={formatPrice(analytics.netProfit)} icon={<FaBalanceScale size={24} className="text-indigo-500" />} />
        </div>
        
        {/* --- FORMULARIOS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-bold text-lg mb-4">Registrar Producción de Huevos</h3>
          <Formik<ProductionFormValues> 
            initialValues={{ date: new Date().toISOString().split('T')[0], quantity: '' }}
            validationSchema={productionValidation}
            onSubmit={handleAddProduction}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-4">
                <CustomInput label="Fecha" name="date" type="date" />
                <CustomInput label="Cantidad de Huevos" name="quantity" type="number" placeholder="Ej: 150" />
                <button type="submit" disabled={isSubmitting} className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-neutral-800 disabled:opacity-50">
                  {isSubmitting ? "Registrando..." : "Registrar Producción"}
                </button>
              </Form>
            )}
          </Formik>
        </div>

        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-bold text-lg mb-4">Registrar Gasto</h3>
          <Formik<ExpenseFormValues> 
            initialValues={{ date: new Date().toISOString().split('T')[0], description: '', amount: '' }}
            validationSchema={expenseValidation}
            onSubmit={handleAddExpense}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-4">
                <CustomInput label="Fecha" name="date" type="date" />
                <CustomInput label="Descripción del Gasto" name="description" type="text" placeholder="Ej: Alimento para gallinas" />
                <CustomInput label="Monto ($)" name="amount" type="number" placeholder="Ej: 25000" />
                <button type="submit" disabled={isSubmitting} className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-neutral-800 disabled:opacity-50">
                  {isSubmitting ? "Registrando..." : "Registrar Gasto"}
                </button>
              </Form>
            )}
          </Formik>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <HistoryTable title="Historial de Producción" items={production} />
        <HistoryTable title="Historial de Gastos" items={expenses} />
      </div>
    </div>
  );
}