"use client";
import { Formik, Form, useFormikContext, FormikHelpers } from "formik";
import * as Yup from "yup";
import axios, { isAxiosError } from "axios";
import { toast } from "react-hot-toast";
import { Settings, Schedule, PaymentMethod } from "@prisma/client";
import { OrderWithDetails } from "@/hooks/useDashboard";
import ModalAdmin from "@/components/ui/ModalAdmin";
import { CustomInput } from "../ui/Input";
import { Select } from "../ui/Select";
import { useEffect, useState } from "react";

type PriceTier = { minQuantity: number; price: number };
type SettingsWithTiers = Settings & { priceTiers: PriceTier[] };

interface AdminOrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SettingsWithTiers;
  schedules: Schedule[];
  onOrderCreated: (newOrder: OrderWithDetails) => void;
}

// 1. Definimos una interfaz clara para los valores del formulario
interface AdminOrderFormValues {
  guestName: string;
  guestPhone: string;
  guestAddress: string;
  mapleQuantity: string | number; // Acepta string del input, se convierte a number al enviar
  scheduleId: string;
  paymentMethod: PaymentMethod | "";
  totalPrice: number;
}

// --- SUB-COMPONENTES ---

const PriceCalculator = ({ settings, schedules }: { settings: SettingsWithTiers; schedules: Schedule[] }) => {
  // Usamos el tipo completo para el contexto
  const { values, setFieldValue } = useFormikContext<AdminOrderFormValues>();
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const quantity = Number(values.mapleQuantity) || 0;
    if (quantity <= 0) {
      setTotal(0);
      return;
    }

    // Calcular precio base según descuentos
   let pricePerMaple = settings.pricePerMaple;
    const sortedTiers = [...settings.priceTiers].sort((a, b) => b.minQuantity - a.minQuantity);
    const applicableTier = sortedTiers.find(tier => quantity >= tier.minQuantity);
    if (applicableTier) pricePerMaple = applicableTier.price;
    const subtotal = quantity * pricePerMaple;

    const selectedSchedule = schedules.find(s => s.id === values.scheduleId);
    let deliveryFee = 0;
    if (selectedSchedule?.type === "DELIVERY" && (!settings.freeDeliveryThreshold || subtotal < settings.freeDeliveryThreshold)) {
      deliveryFee = settings.deliveryFee;
    }

    const finalTotal = subtotal + deliveryFee;
    setTotal(finalTotal);
    setFieldValue("totalPrice", finalTotal);
  }, [values.mapleQuantity, values.scheduleId, settings, schedules, setFieldValue]);

  return (
    <div className="mt-6 pt-4 border-t">
      <p className="text-lg font-bold text-right">
        Total:{" "}
        {total.toLocaleString("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 })}
      </p>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---

export function AdminOrderForm({ isOpen, onClose, settings, schedules, onOrderCreated }: AdminOrderFormProps) {
  const validationSchema = Yup.object({
    guestName: Yup.string().required("Nombre requerido"),
    guestPhone: Yup.string().required("Teléfono requerido"),
    mapleQuantity: Yup.number().positive("Debe ser mayor a 0").required("Cantidad requerida"),
    scheduleId: Yup.string().required("Horario requerido"),
    paymentMethod: Yup.string().oneOf(Object.values(PaymentMethod)).required("Método de pago requerido"),
  });

  // 2. Tipamos la función handleSubmit de forma segura
  const handleSubmit = async (
    values: AdminOrderFormValues,
    { setSubmitting, resetForm }: FormikHelpers<AdminOrderFormValues>
  ) => {
    try {
      // Nos aseguramos de que mapleQuantity sea un número antes de enviar
      const dataToSend = {
        ...values,
        mapleQuantity: Number(values.mapleQuantity),
      };

      const response = await axios.post("/api/orders", dataToSend);
      toast.success("Pedido creado con éxito.");
      onOrderCreated(response.data);
      resetForm();
      onClose();
    } catch (error) { // 3. Manejamos el error de forma segura
      if (isAxiosError(error) && error.response) {
        toast.error(error.response.data?.message || "No se pudo crear el pedido.");
      } else {
        toast.error("Ocurrió un error inesperado.");
      }
      console.error("Error creating order:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const initialValues: AdminOrderFormValues = {
    guestName: "",
    guestPhone: "",
    guestAddress: "",
    mapleQuantity: "",
    scheduleId: "",
    paymentMethod: "",
    totalPrice: 0,
  };

  return (

    <ModalAdmin isOpen={isOpen} onClose={onClose} title="Crear Nuevo Pedido">
      <Formik<AdminOrderFormValues> // Tipamos el componente Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting }) => (
          <Form className="space-y-4">
            <h3 className="font-semibold">Datos del Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CustomInput label="Nombre del Cliente" name="guestName" type="text" />
              <CustomInput label="Teléfono" name="guestPhone" type="tel" />
            </div>
            <CustomInput label="Dirección (si es envío)" name="guestAddress" type="text" />
            <hr className="my-6" />
            <h3 className="font-semibold">Detalles del Pedido</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CustomInput label="Cantidad de Maples" name="mapleQuantity" type="number" />
              <Select label="Método de Pago" name="paymentMethod">
                <option value="">Seleccionar...</option>
                {Object.values(PaymentMethod).map((method) => (
                  <option key={method} value={method}>
                    {method === "CASH" ? "Efectivo" : "Transferencia"}
                  </option>
                ))}
              </Select>
            </div>
            <Select label="Día y Hora de Entrega/Retiro" name="scheduleId">
              <option value="">Seleccionar horario...</option>
              {schedules.map((schedule) => (
                <option key={schedule.id} value={schedule.id}>
                  {`${schedule.dayOfWeek} de ${schedule.startTime} a ${schedule.endTime}hs (${schedule.type})`}
                </option>
              ))}
            </Select>
            <PriceCalculator settings={settings} schedules={schedules} />
            <div className="flex justify-end gap-4 pt-4">
              <button type="button" onClick={onClose} className="rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-300">
                Cancelar
              </button>
              <button type="submit" disabled={isSubmitting} className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-neutral-800 disabled:opacity-50">
                {isSubmitting ? "Creando..." : "Crear Pedido"}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </ModalAdmin>
  );
}