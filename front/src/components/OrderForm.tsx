"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Settings,
  Schedule,
  PaymentMethod,
  ScheduleType,
} from "@prisma/client";
import { Formik, Form, useFormikContext, FormikHelpers } from "formik";
import * as Yup from "yup";
import axios, { isAxiosError } from "axios";
import { CustomInput } from "@/components/ui/CustomInput";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Button } from "@/components/ui/button";
import OrderSuccessModal from "./ui/OrderSuccessModal";
import Link from "next/link";

// --- TIPOS ---
type PriceTier = { minQuantity: number; price: number };
type SettingsWithTiers = Settings & { priceTiers: PriceTier[] };
type MapleOption = { value: string; label: string; price: number };

interface OrderFormProps {
  isLoggedIn: boolean;
  userName?: string | null;
  settings: SettingsWithTiers;
  schedules: Schedule[];
}

interface FormValues {
  name: string;
  phone: string;
  address?: string; // solo si es DELIVERY
  mapleQuantity: string;
  deliveryType: ScheduleType | ""; // "DELIVERY" o "PICKUP"
  dayOfWeek: string; // "Martes", "Viernes", etc.
  scheduleId: string; // id del horario seleccionado
  paymentMethod: PaymentMethod | "";
}

interface FormContentProps extends Omit<OrderFormProps, "userName"> {
  mapleOptions: MapleOption[];
}

// --- SUB-COMPONENTES ---

const FinalPrice = ({
  settings,
  schedules,
  mapleOptions,
}: {
  settings: SettingsWithTiers;
  schedules: Schedule[];
  mapleOptions: MapleOption[];
}) => {
  const { values } = useFormikContext<FormValues>();

  const { subtotal, deliveryFee, totalPrice } = useMemo(() => {
    const quantity = Number(values.mapleQuantity) || 0;
    if (quantity === 0) {
      return { subtotal: 0, deliveryFee: 0, totalPrice: 0 };
    }

    const selectedOption = mapleOptions.find(
      (opt) => opt.value === values.mapleQuantity
    );
    if (!selectedOption) {
      return { subtotal: 0, deliveryFee: 0, totalPrice: 0 };
    }

    const currentSubtotal = selectedOption.price;

    const selectedSchedule = schedules.find((s) => s.id === values.scheduleId);
    let currentDeliveryFee = 0;
    if (
      selectedSchedule?.type === "DELIVERY" &&
      (!settings.freeDeliveryThreshold ||
        currentSubtotal < settings.freeDeliveryThreshold)
    ) {
      currentDeliveryFee = settings.deliveryFee;
    }

    const currentTotalPrice = currentSubtotal + currentDeliveryFee;
    return {
      subtotal: currentSubtotal,
      deliveryFee: currentDeliveryFee,
      totalPrice: currentTotalPrice,
    };
  }, [
    values.mapleQuantity,
    values.scheduleId,
    settings,
    schedules,
    mapleOptions,
  ]);

  const formatPrice = (price: number) =>
    price.toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    });

  return (
    <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
      <div className="flex justify-between text-sm text-gray-600">
        <span>Subtotal</span>
        <span>{formatPrice(subtotal)}</span>
      </div>

      {deliveryFee > 0 && (
        <div className="flex justify-between text-sm text-gray-600">
          <span>Costo de envío</span>
          <span>{formatPrice(deliveryFee)}</span>
        </div>
      )}

      {/* LÍNEA TOTAL */}
      <div className="flex justify-between items-baseline text-lg font-bold text-gray-900">
        <span>Total a pagar:</span>
        <span className="text-2xl">{formatPrice(totalPrice)}</span>
      </div>
    </div>
  );
};

const FormContent = ({
  isLoggedIn,
  settings,
  schedules,
  mapleOptions,
}: FormContentProps) => {
  const { values, setFieldValue, isValid, dirty } =
    useFormikContext<FormValues>();

  const availableDays = useMemo(() => {
    if (!values.deliveryType) return [];
    const days = schedules
      .filter((s) => s.type === values.deliveryType && s.isActive)
      .map((s) => s.dayOfWeek);
    return [...new Set(days)].map((day) => ({ value: day, label: day }));
  }, [values.deliveryType, schedules]);

  const availableTimeRanges = useMemo(() => {
    if (!values.dayOfWeek || !values.deliveryType) return [];
    return schedules
      .filter(
        (s) =>
          s.type === values.deliveryType &&
          s.dayOfWeek === values.dayOfWeek &&
          s.isActive
      )
      .map((s) => ({ value: s.id, label: `${s.startTime} a ${s.endTime}hs` }));
  }, [values.dayOfWeek, values.deliveryType, schedules]);

  useEffect(() => {
    setFieldValue("dayOfWeek", "");
    setFieldValue("scheduleId", "");
  }, [values.deliveryType, setFieldValue]);
  useEffect(() => {
    setFieldValue("scheduleId", "");
  }, [values.dayOfWeek, setFieldValue]);

  return (
    <Form className="space-y-6">
      {!isLoggedIn && (
        <>
          <CustomInput
            label="Nombre Completo"
            name="name"
            type="text"
            placeholder="Juan Pérez"
          />
          <CustomInput
            label="Número de WhatsApp"
            name="phone"
            type="tel"
            placeholder="3491..."
          />
        </>
      )}

      <CustomSelect
        label="1. ¿Cuanta cantidad querés?"
        name="mapleQuantity"
        placeholder="Selecciona una opción..."
        options={mapleOptions}
      />

      <CustomSelect
        label="2. ¿Retirás o te lo enviamos?"
        name="deliveryType"
        placeholder="Selecciona el tipo de entrega..."
        options={[
          { value: ScheduleType.PICKUP, label: "Retiro en el local" },
          { value: ScheduleType.DELIVERY, label: "Envío a domicilio" },
        ]}
      />

      {values.deliveryType && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CustomSelect
            label="3. ¿Qué día?"
            name="dayOfWeek"
            placeholder="Selecciona un día..."
            options={availableDays}
          />
          {values.dayOfWeek && (
            <CustomSelect
              label="4. ¿En qué franja horaria?"
              name="scheduleId"
              placeholder="Selecciona una hora..."
              options={availableTimeRanges}
            />
          )}
        </div>
      )}

      {values.deliveryType === "DELIVERY" && (
        <CustomInput
          label="Dirección de Envío"
          name="address"
          type="text"
          placeholder="Calle Falsa 123"
        />
      )}

      <CustomSelect
        label="5. Método de Pago"
        name="paymentMethod"
        placeholder="Selecciona una opción..."
        options={[
          { value: PaymentMethod.CASH, label: "Efectivo" },
          { value: PaymentMethod.TRANSFER, label: "Transferencia" },
        ]}
      />

      <FinalPrice
        settings={settings}
        schedules={schedules}
        mapleOptions={mapleOptions}
      />

      <Button
        type="submit"
        disabled={!dirty || !isValid}
        className="w-full text-lg mt-4 h-12"
      >
        Hacer mi pedido
      </Button>
    </Form>
  );
};

// --- COMPONENTE PRINCIPAL ---
const OrderForm = ({
  isLoggedIn,
  userName,
  settings,
  schedules,
}: OrderFormProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [successfulOrderData, setSuccessfulOrderData] = useState<{
    paymentMethod?: PaymentMethod;
    totalPrice?: number;
    deliveryType?: ScheduleType | "";
    guestName?: string;
    guestPhone?: string;
  } | null>(null);

  // Funciones para manejar el modal
  const openModalWithData = (data: typeof successfulOrderData) => {
    setSuccessfulOrderData(data);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setSuccessfulOrderData(null);
  };

  const mapleOptions = useMemo(() => {
    const options: MapleOption[] = [];
    const formatPrice = (price: number) =>
      price.toLocaleString("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 0,
      });
    const sortedTiers = [...settings.priceTiers].sort(
      (a, b) => b.minQuantity - a.minQuantity
    );

    for (let i = 1; i <= 10; i++) {
      let pricePerMaple = settings.pricePerMaple;
      const applicableTier = sortedTiers.find((tier) => i >= tier.minQuantity);
      if (applicableTier) pricePerMaple = applicableTier.price;
      const totalPrice = i * pricePerMaple;

      options.push({
        value: i.toString(),
        label: `${i} Maple${i > 1 ? "s" : ""} (${i * 30}) - ${formatPrice(
          totalPrice
        )}`,
        price: totalPrice,
      });
    }
    return options;
  }, [settings]);

  const validationSchema = Yup.object({
    mapleQuantity: Yup.string().required("Selecciona una cantidad"),
    deliveryType: Yup.string()
      .oneOf(Object.values(ScheduleType))
      .required("Selecciona el tipo de entrega"),
    dayOfWeek: Yup.string().required("Selecciona el día"),
    scheduleId: Yup.string().required("Selecciona la hora"),
    paymentMethod: Yup.string()
      .oneOf(Object.values(PaymentMethod))
      .required("Selecciona un método de pago"),
    address: Yup.string().when("deliveryType", {
      is: "DELIVERY",
      then: (schema) =>
        schema.required("La dirección es obligatoria para envíos"),
    }),
    ...(!isLoggedIn && {
      name: Yup.string()
        .min(3, "El nombre es muy corto")
        .required("El nombre es obligatorio"),
      phone: Yup.string()
        .matches(/^[0-9]{10,}$/, "El teléfono debe tener al menos 10 dígitos")
        .required("El teléfono es obligatorio"),
    }),
  });

  const handleSubmit = async (
    values: FormValues,
    { setSubmitting, resetForm }: FormikHelpers<FormValues>
  ) => {
    setError(null);
    try {
      const payload = {
        guestName: values.name,
        guestPhone: values.phone,
        guestAddress: values.address,
        mapleQuantity: Number(values.mapleQuantity),
        scheduleId: values.scheduleId,
        paymentMethod: values.paymentMethod,
      };
      const response = await axios.post("/api/orders", payload);
      const newOrder = response.data;

      // Guardamos los datos necesarios para el modal de éxito
      openModalWithData({
        paymentMethod: newOrder.paymentMethod,
        totalPrice: newOrder.totalPrice,
        deliveryType: values.deliveryType,
        guestName: values.name,
        guestPhone: values.phone,
      });

      resetForm();
    } catch (err) {
      if (isAxiosError(err) && err.response) {
        setError(err.response.data.message || "No se pudo crear la orden.");
      } else {
        setError("Ocurrió un error inesperado.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const initialValues: FormValues = {
    name: "",
    phone: "",
    address: "",
    mapleQuantity: "",
    deliveryType: "",
    dayOfWeek: "",
    scheduleId: "",
    paymentMethod: "",
  };

  return (
    <>
      <div className="w-full mx-auto">
        {isLoggedIn ? (
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              ¡Hola de nuevo,{" "}
              <span className="text-orange-500">{userName}!</span>
            </h2>
            <p className="mt-2 text-lg text-gray-600">
              Listo para tu próximo pedido.
            </p>
          </div>
        ) : (
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
              Pedí tus huevos de campo
            </h2>
            <p className="mt-2 text-lg text-gray-600">
              Completá el formulario y nos pondremos en contacto.
            </p>
            <p className="mt-2 text-md text-gray-600">
              ¿Ya tenés cuenta?{" "}
              <Link
                href="/login"
                className="font-semibold text-orange-500 hover:underline"
              >
                Iniciá sesión
              </Link>
            </p>
          </div>
        )}

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          <FormContent
            isLoggedIn={isLoggedIn}
            settings={settings}
            schedules={schedules}
            mapleOptions={mapleOptions}
          />
        </Formik>

        {error && (
          <p className="mt-4 text-sm text-red-600 text-center">{error}</p>
        )}
      </div>

      <OrderSuccessModal
        isOpen={isModalOpen}
        onClose={closeModal}
        paymentMethod={successfulOrderData?.paymentMethod}
        totalPrice={successfulOrderData?.totalPrice}
        isGuestOrder={!isLoggedIn}
        guestName={successfulOrderData?.guestName}
        guestPhone={successfulOrderData?.guestPhone}
        deliveryType={successfulOrderData?.deliveryType}
      />
    </>
  );
};

export default OrderForm;
