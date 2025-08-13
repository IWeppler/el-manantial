"use client";

import { Formik, Form, Field, useFormikContext } from "formik";
import * as Yup from "yup";
import { useState, useEffect, useMemo } from "react";
import { Select } from "./ui/Select";
import { CustomInput } from "./ui/Input";
import Modal from "@/components/ui/Modal";
import {
  productOptions,
  deliveryTypeOptions,
  deliveryDayOptions,
  deliveryTimeOptions,
  paymentMethodOptions,
} from "../lib/data-form";
import Link from "next/link";

const SHIPPING_COST = 500;
const FREE_SHIPPING_THRESHOLD_MAPLES = 3;

interface FormValues {
  name: string;
  phone: string;
  product: string;
  deliveryType: string;
  address: string;
  deliveryDay: string;
  deliveryTime: string;
  paymentMethod: string;
}

// Esquemas de validación con Yup
const commonSchema = {
  product: Yup.string().required("Por favor, selecciona una cantidad"),
  deliveryType: Yup.string().required("Selecciona el tipo de entrega"),
  deliveryDay: Yup.string().required("Selecciona el día"),
  deliveryTime: Yup.string().required("Selecciona la hora"),
  paymentMethod: Yup.string().required("Selecciona un método de pago"),
  address: Yup.string().when("deliveryType", {
    is: "delivery",
    then: (schema) =>
      schema.required("La dirección es obligatoria para envíos"),
    otherwise: (schema) => schema.notRequired(),
  }),
};

const guestSchema = Yup.object({
  name: Yup.string()
    .min(3, "El nombre es muy corto")
    .required("El nombre es obligatorio"),
  phone: Yup.string()
    .matches(/^[0-9]+$/, "Solo números")
    .min(10, "El teléfono debe tener al menos 10 dígitos")
    .required("El teléfono es obligatorio"),
  ...commonSchema,
});

const userSchema = Yup.object({ ...commonSchema });

// Componente hijo para el contenido del formulario
const FormContent = ({ isLoggedIn }: { isLoggedIn: boolean }) => {
  const { values, isValid, dirty } = useFormikContext<FormValues>();
  const [totalPrice, setTotalPrice] = useState(0);

  const maples = useMemo(
    () => parseInt(values.product || "0", 10) / 30,
    [values.product]
  );
  const isShippingFree = maples >= FREE_SHIPPING_THRESHOLD_MAPLES;

  useEffect(() => {
    const selectedProduct = productOptions.find(
      (p) => p.value === values.product
    );
    const productPrice = selectedProduct?.price || 0;

    let shippingCost = 0;
    if (values.deliveryType === "delivery" && !isShippingFree) {
      shippingCost = SHIPPING_COST;
    }

    setTotalPrice(productPrice + shippingCost);
  }, [values.product, values.deliveryType, isShippingFree]);

  const formatPrice = (price: number) =>
    price.toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    });

  return (
    <>
      {!isLoggedIn && (
        <p className="text-center text-neutral-800 mb-4">
          ¿Ya tenés cuenta?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Iniciá sesión
          </Link>
        </p>
      )}

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

        <Select label="1. ¿Qué cantidad querés?" name="product">
          <option value="">Selecciona una opción...</option>
          {productOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        <Select label="2. ¿Retirás o te lo enviamos?" name="deliveryType">
          <option value="">Selecciona una opción...</option>
          <option value={deliveryTypeOptions[0].value}>
            {deliveryTypeOptions[0].label}
          </option>
          <option value={deliveryTypeOptions[1].value}>
            {deliveryTypeOptions[1].label}{" "}
            {isShippingFree ? "(¡Gratis!)" : `(+${formatPrice(SHIPPING_COST)})`}
          </option>
        </Select>

        {values.deliveryType === "delivery" && (
          <Field
            as={CustomInput}
            label="Dirección de Envío"
            name="address"
            type="text"
            placeholder="Gobernador Crespo 1658"
          />
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Select label="3. ¿Qué día?" name="deliveryDay">
            <option value="">Selecciona un día...</option>
            {deliveryDayOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Select label="4. ¿A qué hora?" name="deliveryTime">
            <option value="">Selecciona una hora...</option>
            {deliveryTimeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <Select label="5. Método de Pago" name="paymentMethod">
          <option value="">Selecciona una opción...</option>
          {paymentMethodOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex justify-between text-lg font-bold text-gray-900">
            <span>Total a pagar:</span>
            <span>
              {totalPrice.toLocaleString("es-AR", {
                style: "currency",
                currency: "ARS",
                minimumFractionDigits: 0,
              })}
            </span>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={!dirty || !isValid}
            className="mt-4 w-full cursor-pointer rounded-md border border-transparent bg-primary px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-neutral-950 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Hacer mi pedido
          </button>
        </div>
      </Form>
    </>
  );
};

interface OrderFormProps {
  isLoggedIn: boolean;
  userName?: string;
}

// Componente principal que maneja el estado
const OrderForm = ({ isLoggedIn, userName }: OrderFormProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successfulOrderData, setSuccessfulOrderData] = useState<{
    paymentMethod?: string;
    totalPrice?: number;
    guestName?: string;
    guestPhone?: string;
    deliveryType?: string;
  } | null>(null);

  const openModalWithData = (data: {
    paymentMethod?: string;
    totalPrice?: number;
    guestName?: string;
    guestPhone?: string;
    deliveryType?: string;
  }) => {
    setSuccessfulOrderData(data);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setSuccessfulOrderData(null);
  };

  const initialValues: FormValues = {
    name: "",
    phone: "",
    product: "",
    deliveryType: "",
    address: "",
    deliveryDay: "",
    deliveryTime: "",
    paymentMethod: "",
  };

  return (
    <>
      <div className="w-full pb-8">
        {isLoggedIn ? (
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              ¡Hola de nuevo, <span className="text-primary">{userName}!</span>
            </h2>
            <p className="mt-2 text-lg text-gray-600">
              Listo para tu próximo pedido.
            </p>
          </div>
        ) : (
          <div className="mb-2">
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
              Pedí tus huevos de campo
            </h2>
            <p className="mt-2 text-lg text-gray-600">
              Completá el formulario y nos pondremos en contacto.
            </p>
          </div>
        )}

        <Formik
          initialValues={initialValues}
          validationSchema={isLoggedIn ? userSchema : guestSchema}
          onSubmit={async (values, { setSubmitting, resetForm }) => {
            setError(null);
            try {
              const response = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
              });

              if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "No se pudo crear la orden.");
              }

              const newOrder = await response.json();

              openModalWithData({
                paymentMethod: newOrder.paymentMethod,
                totalPrice: newOrder.totalPrice,
                guestName: values.name,
                guestPhone: values.phone,
                deliveryType: values.deliveryType,
              });

              resetForm();
            } catch (err) {
              if (err instanceof Error) {
                setError(err.message);
              } else {
                setError("Ocurrió un error inesperado.");
              }
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <FormContent isLoggedIn={isLoggedIn} />
        </Formik>
        {error && (
          <p className="mt-4 text-sm text-red-600 text-center">{error}</p>
        )}
      </div>

      {/* 4. Pasamos los datos completos al modal */}
      <Modal
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
