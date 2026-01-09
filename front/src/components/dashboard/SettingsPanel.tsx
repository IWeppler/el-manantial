"use client";

import { Schedule, Settings, ScheduleType } from "@prisma/client";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Formik, Form, FieldArray, FormikHelpers, Field } from "formik";
import {
  Plus,
  Trash2,
  Truck,
  Store,
  DollarSign,
  Tag,
  Save,
  Loader2,
} from "lucide-react";

// --- TIPOS ---
type PriceTier = { minQuantity: number; price: number };
type SettingsWithTiers = Settings & { priceTiers: PriceTier[] };

interface SettingsFormValues {
  settings: SettingsWithTiers;
  schedules: Schedule[];
}

interface SettingsPanelProps {
  initialSettings: SettingsWithTiers;
  initialSchedules: Schedule[];
}

// --- ESTILOS REUTILIZABLES ---
const cardBg =
  "bg-[#18181b] border border-white/5 rounded-xl shadow-sm overflow-hidden";
const cardHeader =
  "p-4 border-b border-white/5 flex items-center gap-2 bg-white/[0.02]";
const cardBody = "p-5 space-y-4";
const inputClasses =
  "w-full bg-[#0f0f11] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-zinc-600";
const labelClasses = "block text-xs font-medium text-zinc-400 mb-1.5 ml-1";
const btnDeleteClasses =
  "p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors border border-red-500/20";
const btnAddClasses =
  "flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-medium hover:bg-blue-500/20 transition-colors border border-blue-500/20";

// --- SUB-COMPONENTE: GESTIÓN DE HORARIOS ---
const ScheduleManager = ({
  type,
  schedules,
  push,
  remove,
}: {
  type: ScheduleType;
  schedules: Schedule[];
  push: (obj: Partial<Schedule>) => void;
  remove: (index: number) => void;
}) => {
  const isDelivery = type === ScheduleType.DELIVERY;
  const title = isDelivery ? "Horarios de Envío" : "Horarios de Retiro";
  const Icon = isDelivery ? Truck : Store;

  const dayOptions = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo",
  ];
  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, "0");
    return `${hour}:00`;
  });

  return (
    <div className={cardBg}>
      <div className={cardHeader}>
        <Icon
          size={16}
          className={isDelivery ? "text-blue-400" : "text-emerald-400"}
        />
        <h3 className="text-sm font-bold text-white">{title}</h3>
      </div>

      <div className={cardBody}>
        {schedules.map(
          (schedule, index) =>
            schedule.type === type && (
              <div key={index} className="flex gap-3 items-end group">
                <div className="flex-1">
                  <label className={labelClasses}>Día</label>
                  <Field
                    as="select"
                    name={`schedules.${index}.dayOfWeek`}
                    className={inputClasses}
                  >
                    {dayOptions.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </Field>
                </div>
                <div className="w-24">
                  <label className={labelClasses}>Desde</label>
                  <Field
                    as="select"
                    name={`schedules.${index}.startTime`}
                    className={inputClasses}
                  >
                    {timeOptions.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </Field>
                </div>
                <div className="w-24">
                  <label className={labelClasses}>Hasta</label>
                  <Field
                    as="select"
                    name={`schedules.${index}.endTime`}
                    className={inputClasses}
                  >
                    {timeOptions.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </Field>
                </div>
                <button
                  type="button"
                  className={btnDeleteClasses}
                  onClick={() => remove(index)}
                  title="Eliminar horario"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )
        )}

        <div className="pt-2">
          <button
            type="button"
            className={btnAddClasses}
            onClick={() =>
              push({
                dayOfWeek: "Lunes",
                startTime: "09:00",
                endTime: "12:00",
                type,
              })
            }
          >
            <Plus size={14} /> Agregar Horario
          </button>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
export function SettingsPanel({
  initialSettings,
  initialSchedules,
}: SettingsPanelProps) {
  const handleSubmit = async (
    values: SettingsFormValues,
    { setSubmitting }: FormikHelpers<SettingsFormValues>
  ) => {
    try {
      // Convertir a números los valores de settings antes de enviar
      const settingsToSend = {
        ...values.settings,
        pricePerMaple: Number(values.settings.pricePerMaple),
        pricePerHalfDozen: Number(values.settings.pricePerHalfDozen),
        deliveryFee: Number(values.settings.deliveryFee),
        priceTiers: values.settings.priceTiers.map((t) => ({
          minQuantity: Number(t.minQuantity),
          price: Number(t.price),
        })),
      };

      await Promise.all([
        axios.patch("/api/settings", settingsToSend),
        axios.patch("/api/schedules", { schedules: values.schedules }),
      ]);
      toast.success("Configuración guardada exitosamente");
    } catch (error) {
      toast.error("Error al guardar la configuración");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Formik
      initialValues={{
        settings: initialSettings,
        schedules: initialSchedules,
      }}
      onSubmit={handleSubmit}
      enableReinitialize
    >
      {({ values, isSubmitting }) => (
        <Form className="space-y-6 max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-2">
            <button
              type="button" 
              disabled={isSubmitting}
              onClick={() => {
              }}
              className="hidden" 
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* COLUMNA IZQUIERDA: PRECIOS */}
            <div className="space-y-6">
              {/* Tarjeta Precios Base */}
              <div className={cardBg}>
                <div className={cardHeader}>
                  <DollarSign size={16} className="text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">Precios Base</h3>
                </div>
                <div className={cardBody}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClasses}>Precio Maple ($)</label>
                      <Field
                        name="settings.pricePerMaple"
                        type="number"
                        className={inputClasses}
                      />
                    </div>
                    <div>
                      <label className={labelClasses}>
                        Precio 1/2 Docena ($)
                      </label>
                      <Field
                        name="settings.pricePerHalfDozen"
                        type="number"
                        className={inputClasses}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className={labelClasses}>
                        Costo de Envío Fijo ($)
                      </label>
                      <Field
                        name="settings.deliveryFee"
                        type="number"
                        className={inputClasses}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Tarjeta Descuentos Mayoristas */}
              <div className={cardBg}>
                <div className={cardHeader}>
                  <Tag size={16} className="text-orange-400" />
                  <h3 className="text-sm font-bold text-white">
                    Precios Mayoristas (Escalas)
                  </h3>
                </div>
                <div className={cardBody}>
                  <FieldArray name="settings.priceTiers">
                    {({ remove, push }) => (
                      <div className="space-y-3">
                        {values.settings.priceTiers.length === 0 && (
                          <p className="text-xs text-zinc-500 text-center py-2">
                            No hay descuentos configurados.
                          </p>
                        )}

                        {values.settings.priceTiers.map((tier, index) => (
                          <div key={index} className="flex gap-3 items-end">
                            <div className="flex-1">
                              <label className={labelClasses}>
                                Cant. Mínima
                              </label>
                              <Field
                                name={`settings.priceTiers.${index}.minQuantity`}
                                type="number"
                                className={inputClasses}
                                placeholder="Ej: 10"
                              />
                            </div>
                            <div className="flex-1">
                              <label className={labelClasses}>Precio ($)</label>
                              <Field
                                name={`settings.priceTiers.${index}.price`}
                                type="number"
                                className={inputClasses}
                                placeholder="Ej: 4500"
                              />
                            </div>
                            <button
                              type="button"
                              className={btnDeleteClasses}
                              onClick={() => remove(index)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}

                        <div className="pt-2">
                          <button
                            type="button"
                            className={btnAddClasses}
                            onClick={() => push({ minQuantity: "", price: "" })}
                          >
                            <Plus size={14} /> Nueva Escala
                          </button>
                        </div>
                      </div>
                    )}
                  </FieldArray>
                </div>
              </div>
            </div>

            {/* COLUMNA DERECHA: HORARIOS */}
            <div className="space-y-6">
              <FieldArray name="schedules">
                {({ remove, push }) => (
                  <>
                    <ScheduleManager
                      type={ScheduleType.PICKUP}
                      schedules={values.schedules}
                      push={push}
                      remove={remove}
                    />
                    <ScheduleManager
                      type={ScheduleType.DELIVERY}
                      schedules={values.schedules}
                      push={push}
                      remove={remove}
                    />
                  </>
                )}
              </FieldArray>
            </div>
          </div>

          {/* BARRA INFERIOR FLOTANTE DE GUARDADO */}
          <div className="sticky bottom-4 z-20 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-xl shadow-blue-900/50 flex items-center gap-2 font-bold transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {isSubmitting ? "Guardando..." : "Guardar Todos los Cambios"}
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
}
