"use client";
import { Formik, Form, useFormikContext, FormikHelpers } from "formik";
import * as Yup from "yup";
import axios, { isAxiosError } from "axios";
import { toast } from "react-hot-toast";
import { Settings, Schedule, PaymentMethod, ScheduleType } from "@prisma/client";
import { OrderWithDetails } from "@/hooks/useDashboard";
import { useEffect, useState, useMemo } from "react";
import { CustomInput } from "@/components/ui/CustomInput";
import { CustomSelect } from "@/components/ui/CustomSelect";
import Modal from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";

// --- TIPOS ---
type PriceTier = { minQuantity: number; price: number };
type SettingsWithTiers = Settings & { priceTiers: PriceTier[] };

interface AdminOrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SettingsWithTiers;
  schedules: Schedule[];
  onOrderCreated: (newOrder: OrderWithDetails) => void;
}

interface AdminOrderFormValues {
  guestName: string; guestPhone: string; guestAddress: string;
  mapleQuantity: string | number;
  deliveryType: ScheduleType | "";
  dayOfWeek: string;
  scheduleId: string;
  paymentMethod: PaymentMethod | "";
  totalPrice: number;
}

// --- SUB-COMPONENTES ---

const PriceCalculator = ({ settings, schedules }: { settings: SettingsWithTiers; schedules: Schedule[]; }) => {
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
    const sortedTiers = [...settings.priceTiers].sort(
      (a, b) => b.minQuantity - a.minQuantity
    );
    const applicableTier = sortedTiers.find(
      (tier) => quantity >= tier.minQuantity
    );
    if (applicableTier) pricePerMaple = applicableTier.price;
    const subtotal = quantity * pricePerMaple;

    const selectedSchedule = schedules.find((s) => s.id === values.scheduleId);
    let deliveryFee = 0;
    if (
      selectedSchedule?.type === "DELIVERY" &&
      (!settings.freeDeliveryThreshold ||
        subtotal < settings.freeDeliveryThreshold)
    ) {
      deliveryFee = settings.deliveryFee;
    }

    const finalTotal = subtotal + deliveryFee;
    setTotal(finalTotal);
    setFieldValue("totalPrice", finalTotal);
  }, [
    values.mapleQuantity,
    values.scheduleId,
    settings,
    schedules,
    setFieldValue,
  ]);

  return (
    <div className="mt-6 pt-4 border-t">
      <p className="text-lg font-bold text-right">
        Total:{" "}
        {total.toLocaleString("es-AR", {
          style: "currency",
          currency: "ARS",
          minimumFractionDigits: 0,
        })}
      </p>
    </div>
  );
};

const OrderFormFields = ({ schedules, settings, onClose }: { schedules: Schedule[]; settings: SettingsWithTiers; onClose: () => void; }) => {
    const { values, setFieldValue, isSubmitting } = useFormikContext<AdminOrderFormValues>();

    const availableDays = useMemo(() => {
        if (!values.deliveryType) return [];
        const days = schedules.filter(s => s.type === values.deliveryType).map(s => s.dayOfWeek);
        return [...new Set(days)].map(day => ({ value: day, label: day }));
    }, [values.deliveryType, schedules]);

    const availableTimes = useMemo(() => {
        if (!values.dayOfWeek || !values.deliveryType) return [];
        return schedules
            .filter(s => s.type === values.deliveryType && s.dayOfWeek === values.dayOfWeek)
            .map(s => ({ value: s.id, label: `${s.startTime} a ${s.endTime}hs` }));
    }, [values.dayOfWeek, values.deliveryType, schedules]);
    
    useEffect(() => { setFieldValue('dayOfWeek', ''); setFieldValue('scheduleId', ''); }, [values.deliveryType, setFieldValue]);
    useEffect(() => { setFieldValue('scheduleId', ''); }, [values.dayOfWeek, setFieldValue]);

    return (
        <Form className="space-y-4">
            <h3 className="font-semibold">Datos del Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CustomInput label="Nombre del Cliente" name="guestName" type="text" />
                <CustomInput label="Teléfono" name="guestPhone" type="tel" />
            </div>
            {values.deliveryType === 'DELIVERY' && (
                <CustomInput label="Dirección de Envío" name="guestAddress" type="text" />
            )}
            <hr className="my-6" />

            <h3 className="font-semibold">Detalles del Pedido</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CustomInput label="Cantidad de Maples" name="mapleQuantity" type="number" />
                <CustomSelect label="Método de Pago" name="paymentMethod" placeholder="Seleccionar..." options={[{value: 'CASH', label: 'Efectivo'}, {value: 'TRANSFER', label: 'Transferencia'}]} />
            </div>

            <CustomSelect label="Tipo de Entrega" name="deliveryType" placeholder="Retiro o envío..." options={[{value: 'PICKUP', label: 'Retiro en local'}, {value: 'DELIVERY', label: 'Envío a domicilio'}]} />

            {values.deliveryType && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CustomSelect label="Día" name="dayOfWeek" placeholder="Seleccionar día..." options={availableDays} />
                    {values.dayOfWeek && (
                        <CustomSelect label="Franja Horaria" name="scheduleId" placeholder="Seleccionar franja..." options={availableTimes} />
                    )}
                </div>
            )}

            <PriceCalculator settings={settings} schedules={schedules} />
            
            <div className="flex justify-end gap-4 pt-4">
                <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creando..." : "Crear Pedido"}
                </Button>
            </div>
        </Form>
    );
};

// --- COMPONENTE PRINCIPAL ---
export function AdminOrderForm({ isOpen, onClose, settings, schedules, onOrderCreated }: AdminOrderFormProps) {
  
  const validationSchema = Yup.object({
    guestName: Yup.string().required("Nombre requerido"),
    guestPhone: Yup.string().required("Teléfono requerido"),
    mapleQuantity: Yup.number().positive("Debe ser mayor a 0").required("Cantidad requerida"),
    deliveryType: Yup.string().oneOf(Object.values(ScheduleType)).required("Selecciona un tipo"),
    dayOfWeek: Yup.string().required("Selecciona un día"),
    scheduleId: Yup.string().required("Selecciona una hora"),
    paymentMethod: Yup.string().oneOf(Object.values(PaymentMethod)).required("Método de pago requerido"),
    guestAddress: Yup.string().when("deliveryType", { is: 'DELIVERY', then: (schema) => schema.required("La dirección es obligatoria para envíos") }),
  });

  const handleSubmit = async (values: AdminOrderFormValues, { setSubmitting, resetForm }: FormikHelpers<AdminOrderFormValues>) => {
    try {
      const dataToSend = { ...values, mapleQuantity: Number(values.mapleQuantity) };
      const response = await axios.post("/api/orders", dataToSend);
      toast.success("Pedido creado con éxito.");
      onOrderCreated(response.data);
      resetForm();
      onClose();
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        toast.error(error.response.data?.message || "No se pudo crear el pedido.");
      } else {
        toast.error("Ocurrió un error inesperado.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const initialValues: AdminOrderFormValues = {
    guestName: "", guestPhone: "", guestAddress: "", mapleQuantity: "",
    deliveryType: "", dayOfWeek: "", scheduleId: "", paymentMethod: "", totalPrice: 0,
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Crear Nuevo Pedido">
      <Formik<AdminOrderFormValues>
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        <OrderFormFields settings={settings} schedules={schedules} onClose={onClose} />
      </Formik>
    </Modal>
  );
}