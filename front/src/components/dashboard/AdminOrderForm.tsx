"use client";

import { Formik, Form, useFormikContext, FormikHelpers, Field } from "formik";
import * as Yup from "yup";
import axios, { isAxiosError } from "axios";
import { toast } from "react-hot-toast";
import {
  Settings,
  Schedule,
  PaymentMethod,
  ScheduleType,
} from "@prisma/client";
import { OrderWithDetails } from "@/hooks/useDashboard";
import { useEffect, useState, useMemo, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  Search,
  Loader2,
  Check,
  User,
  MapPin,
  Phone,
  Calculator,
  CreditCard,
  Truck,
  X,
} from "lucide-react";

// --- TIPOS ---
type PriceTier = { minQuantity: number; price: number };
type SettingsWithTiers = Settings & { priceTiers: PriceTier[] };

// Interfaz para los resultados de la API de clientes
interface ClientSearchResult {
  id: string;
  name: string;
  phone: string;
  address?: string | null;
}

interface AdminOrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SettingsWithTiers;
  schedules: Schedule[];
  onOrderCreated: (newOrder: OrderWithDetails) => void;
}

interface AdminOrderFormValues {
  userId?: string;
  guestName: string;
  guestPhone: string;
  guestAddress: string;
  mapleQuantity: string | number;
  deliveryType: ScheduleType | "";
  dayOfWeek: string;
  scheduleId: string;
  paymentMethod: PaymentMethod | "";
  totalPrice: number;
}

// --- ESTILOS REUTILIZABLES (DARK MODE) ---
const inputClasses =
  "w-full bg-[#0f0f11] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-zinc-600";
const labelClasses = "block text-xs font-medium text-zinc-400 mb-1.5 ml-1";
const errorClasses = "text-red-400 text-xs mt-1 ml-1";
const sectionTitleClasses =
  "text-sm font-bold text-white mb-4 flex items-center gap-2 border-b border-white/5 pb-2";

// --- SUB-COMPONENTES ---

const PriceCalculator = ({
  settings,
  schedules,
}: {
  settings: SettingsWithTiers;
  schedules: Schedule[];
}) => {
  const { values, setFieldValue } = useFormikContext<AdminOrderFormValues>();
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const quantity = Number(values.mapleQuantity) || 0;
    if (quantity <= 0) {
      setTotal(0);
      return;
    }

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
    <div className="flex flex-col items-end justify-center bg-[#0f0f11] p-4 rounded-xl border border-white/5 mt-6">
      <span className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">
        Total Estimado
      </span>
      <span className="text-3xl font-bold text-emerald-400">
        {total.toLocaleString("es-AR", {
          style: "currency",
          currency: "ARS",
          minimumFractionDigits: 0,
        })}
      </span>
      {values.deliveryType === "DELIVERY" && settings.deliveryFee > 0 && (
        <span className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
          <Truck size={10} /> Incluye envío si corresponde
        </span>
      )}
    </div>
  );
};

const OrderFormFields = ({
  schedules,
  settings,
  onClose,
}: {
  schedules: Schedule[];
  settings: SettingsWithTiers;
  onClose: () => void;
}) => {
  const { values, setFieldValue, isSubmitting, errors, touched } =
    useFormikContext<AdminOrderFormValues>();

  // Estados Buscador
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<ClientSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Búsqueda de clientes (Debounce)
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.length > 2) {
        setIsSearching(true);
        try {
          const res = await axios.get<ClientSearchResult[]>(
            `/api/clients?q=${searchTerm}`
          );
          setSearchResults(res.data);
        } catch (error) {
          console.error("Error buscando clientes", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleSelectClient = (client: ClientSearchResult) => {
    setFieldValue("userId", client.id);
    setFieldValue("guestName", client.name);
    setFieldValue("guestPhone", client.phone);
    setFieldValue("guestAddress", client.address || "");
    setSearchResults([]);
    setSearchTerm("");
    toast.success("Cliente cargado");
  };

  // Lógica Horarios
  const availableDays = useMemo(() => {
    if (!values.deliveryType) return [];
    const days = schedules
      .filter((s) => s.type === values.deliveryType)
      .map((s) => s.dayOfWeek);
    return [...new Set(days)].map((day) => ({ value: day, label: day }));
  }, [values.deliveryType, schedules]);

  const availableTimes = useMemo(() => {
    if (!values.dayOfWeek || !values.deliveryType) return [];
    return schedules
      .filter(
        (s) =>
          s.type === values.deliveryType && s.dayOfWeek === values.dayOfWeek
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
      {/* --- BUSCADOR --- */}
      <div className="bg-indigo-500/5 p-4 rounded-xl border border-indigo-500/20 relative">
        <label className="text-xs font-bold text-indigo-400 uppercase tracking-wide mb-2 flex items-center gap-2">
          <Search size={14} /> Buscar Cliente Existente
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Escribe nombre o teléfono..."
            className="w-full bg-[#18181b] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-zinc-600"
          />
          <Search className="absolute left-3 top-2.5 text-zinc-500 w-4 h-4" />
          {isSearching && (
            <Loader2 className="absolute right-3 top-2.5 text-indigo-400 w-4 h-4 animate-spin" />
          )}

          {/* Resultados Flotantes */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto divide-y divide-white/5">
              {searchResults.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => handleSelectClient(client)}
                  className="w-full text-left px-4 py-3 hover:bg-white/5 flex justify-between items-center group transition-colors"
                >
                  <div>
                    <p className="text-sm font-bold text-white group-hover:text-indigo-400">
                      {client.name}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {client.phone} {client.address && `• ${client.address}`}
                    </p>
                  </div>
                  <Check
                    size={16}
                    className="text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- DATOS CLIENTE --- */}
      <div>
        <h3 className={sectionTitleClasses}>
          <User size={16} className="text-zinc-400" /> Datos del Cliente
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClasses}>Nombre Completo</label>
            <Field
              name="guestName"
              className={inputClasses}
              placeholder="Ej: Juan Perez"
            />
            {errors.guestName && touched.guestName && (
              <div className={errorClasses}>{errors.guestName}</div>
            )}
          </div>
          <div>
            <label className={labelClasses}>Teléfono</label>
            <Field
              name="guestPhone"
              className={inputClasses}
              placeholder="3491..."
            />
            {errors.guestPhone && touched.guestPhone && (
              <div className={errorClasses}>{errors.guestPhone}</div>
            )}
          </div>
        </div>

        <div
          className={`mt-4 transition-all duration-300 ${
            values.deliveryType === "PICKUP" && !values.guestAddress
              ? "hidden"
              : "block"
          }`}
        >
          <label className={labelClasses}>Dirección de Entrega</label>
          <div className="relative">
            <Field
              name="guestAddress"
              className={`${inputClasses} pl-10`}
              placeholder="Calle, Altura, Barrio..."
            />
            <MapPin className="absolute left-3 top-3 text-zinc-500 w-5 h-5" />
          </div>
          {errors.guestAddress && touched.guestAddress && (
            <div className={errorClasses}>{errors.guestAddress}</div>
          )}
        </div>
      </div>

      {/* --- DETALLES PEDIDO --- */}
      <div>
        <h3 className={sectionTitleClasses}>
          <Calculator size={16} className="text-zinc-400" /> Detalle del Pedido
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className={labelClasses}>Cantidad de Maples</label>
            <Field
              name="mapleQuantity"
              type="number"
              className={inputClasses}
            />
            {errors.mapleQuantity && touched.mapleQuantity && (
              <div className={errorClasses}>{errors.mapleQuantity}</div>
            )}
          </div>
          <div>
            <label className={labelClasses}>Método de Pago</label>
            <div className="relative">
              <Field
                as="select"
                name="paymentMethod"
                className={inputClasses}
              >
                <option value="">Seleccionar...</option>
                <option value="CASH">Efectivo</option>
                <option value="TRANSFER">Transferencia</option>
              </Field>
              <CreditCard className="absolute right-3 top-3 text-zinc-500 w-5 h-5 pointer-events-none" />
            </div>
            {errors.paymentMethod && touched.paymentMethod && (
              <div className={errorClasses}>{errors.paymentMethod}</div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className={labelClasses}>Tipo de Entrega</label>
            <Field as="select" name="deliveryType" className={inputClasses}>
              <option value="">Seleccionar...</option>
              <option value="PICKUP">Retiro en local</option>
              <option value="DELIVERY">Envío a domicilio</option>
            </Field>
            {errors.deliveryType && touched.deliveryType && (
              <div className={errorClasses}>{errors.deliveryType}</div>
            )}
          </div>

          {values.deliveryType && (
            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div>
                <label className={labelClasses}>Día</label>
                <Field
                  as="select"
                  name="dayOfWeek"
                  className={inputClasses}
                >
                  <option value="">Día...</option>
                  {availableDays.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </Field>
                {errors.dayOfWeek && touched.dayOfWeek && (
                  <div className={errorClasses}>{errors.dayOfWeek}</div>
                )}
              </div>
              <div>
                <label className={labelClasses}>Horario</label>
                <Field
                  as="select"
                  name="scheduleId"
                  className={inputClasses}
                >
                  <option value="">Hora...</option>
                  {availableTimes.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </Field>
                {errors.scheduleId && touched.scheduleId && (
                  <div className={errorClasses}>{errors.scheduleId}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <PriceCalculator settings={settings} schedules={schedules} />

      <div className="flex justify-end gap-3 pt-2 border-t border-white/5 mt-6">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 rounded-lg border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 transition-colors text-sm font-medium"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all text-sm font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting && <Loader2 className="animate-spin w-4 h-4" />}
          {isSubmitting ? "Procesando..." : "Confirmar Pedido"}
        </button>
      </div>
    </Form>
  );
};

// --- COMPONENTE PRINCIPAL ---
export function AdminOrderForm({
  isOpen,
  onClose,
  settings,
  schedules,
  onOrderCreated,
}: AdminOrderFormProps) {
  const validationSchema = Yup.object({
    guestName: Yup.string().required("Requerido"),
    guestPhone: Yup.string().required("Requerido"),
    mapleQuantity: Yup.number().positive("Mayor a 0").required("Requerido"),
    deliveryType: Yup.string()
      .oneOf(Object.values(ScheduleType))
      .required("Requerido"),
    dayOfWeek: Yup.string().required("Requerido"),
    scheduleId: Yup.string().required("Requerido"),
    paymentMethod: Yup.string()
      .oneOf(Object.values(PaymentMethod))
      .required("Requerido"),
    guestAddress: Yup.string().when("deliveryType", {
      is: "DELIVERY",
      then: (schema) => schema.required("Dirección obligatoria para envíos"),
    }),
  });

  const handleSubmit = async (
    values: AdminOrderFormValues,
    { setSubmitting, resetForm }: FormikHelpers<AdminOrderFormValues>
  ) => {
    try {
      const dataToSend = {
        ...values,
        mapleQuantity: Number(values.mapleQuantity),
      };
      const response = await axios.post("/api/orders", dataToSend);
      toast.success("¡Pedido creado!");
      onOrderCreated(response.data);
      resetForm();
      onClose();
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        toast.error(error.response.data?.message || "Error al crear pedido.");
      } else {
        toast.error("Error inesperado.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const initialValues: AdminOrderFormValues = {
    userId: "",
    guestName: "",
    guestPhone: "",
    guestAddress: "",
    mapleQuantity: "",
    deliveryType: "",
    dayOfWeek: "",
    scheduleId: "",
    paymentMethod: "",
    totalPrice: 0,
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-[#18181b] border border-white/10 p-6 shadow-xl transition-all text-left">
                {/* Header Modal */}
                <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                  <Dialog.Title
                    as="h3"
                    className="text-xl font-bold text-white leading-6"
                  >
                    Crear Nuevo Pedido
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-zinc-400 hover:text-white transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Contenido Formik */}
                <Formik<AdminOrderFormValues>
                  initialValues={initialValues}
                  validationSchema={validationSchema}
                  onSubmit={handleSubmit}
                >
                  <OrderFormFields
                    settings={settings}
                    schedules={schedules}
                    onClose={onClose}
                  />
                </Formik>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}