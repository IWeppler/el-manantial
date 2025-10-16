"use client";
import { Schedule, Settings, ScheduleType } from "@prisma/client";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Formik, Form, FieldArray, FormikHelpers } from "formik";
import * as Yup from "yup";
import { FaPlus, FaTrash } from "react-icons/fa";
import { CustomInput } from "../ui/CustomInput";
import { CustomSelect } from "../ui/CustomSelect";
import { Button } from "../ui/button";

// --- TIPOS ---
type PriceTier = { minQuantity: number; price: number };
type SettingsWithTiers = Settings & { priceTiers: PriceTier[] };

// Nuevo tipo para los valores completos del formulario
interface SettingsFormValues {
  settings: SettingsWithTiers;
  schedules: Schedule[];
}

interface SettingsPanelProps {
  initialSettings: SettingsWithTiers;
  initialSchedules: Schedule[];
}

// Esquema de validación con estructura anidada
const validationSchema = Yup.object({
  pricePerMaple: Yup.number()
    .positive("Debe ser positivo")
    .required("Requerido"),
  pricePerHalfDozen: Yup.number().positive("Debe ser positivo").nullable(),
  deliveryFee: Yup.number()
    .min(0, "No puede ser negativo")
    .required("Requerido"),
  priceTiers: Yup.array().of(
    Yup.object({
      minQuantity: Yup.number().positive("Debe ser > 0").required("Requerido"),
      price: Yup.number().positive("Debe ser > 0").required("Requerido"),
    })
  ),
});

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
      await Promise.all([
        axios.patch("/api/settings", values.settings),
        axios.patch("/api/schedules", { schedules: values.schedules }),
      ]);
      toast.success("Configuración y horarios guardados con éxito.");
    } catch (error) {
      toast.error("No se pudo guardar la configuración.");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow space-y-8">
      <Formik
        initialValues={{
          settings: initialSettings,
          schedules: initialSchedules,
        }}
        // validationSchema={validationSchema} // Puedes descomentar esto si quieres validación
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ values, isSubmitting }) => (
          <Form className="space-y-6">
            <div>
              <h3 className="text-xl font-bold mb-4">Precios y Descuentos</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <CustomInput
                  label="Precio por Maple ($)"
                  name="settings.pricePerMaple"
                  type="number"
                />
                <CustomInput
                  label="Precio por Media Docena ($)"
                  name="settings.pricePerHalfDozen"
                  type="number"
                />
                <CustomInput
                  label="Costo de Envío ($)"
                  name="settings.deliveryFee"
                  type="number"
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">
                Gestión de Horarios
              </h3>

              <FieldArray name="schedules">
                {({ remove, push }) => (
                  <div className="space-y-4">
                    {values.schedules.map((schedule, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-1 sm:grid-cols-6 gap-4 items-end p-3 bg-gray-50 rounded-md border"
                      >
                        <CustomSelect
                          label="Día"
                          name={`schedules.${index}.dayOfWeek`}
                          options={[
                            { value: "Lunes", label: "Lunes" },
                            { value: "Martes", label: "Martes" },
                            { value: "Miércoles", label: "Miércoles" },
                            { value: "Jueves", label: "Jueves" },
                            { value: "Viernes", label: "Viernes" },
                            { value: "Sábado", label: "Sábado" },
                            { value: "Domingo", label: "Domingo" },
                          ]}
                        />

                        <CustomSelect
                          label="Desde"
                          name={`schedules.${index}.startTime`}
                          options={[
                            { value: "09:00", label: "09:00" },
                            { value: "10:00", label: "10:00" },
                            { value: "11:00", label: "11:00" },
                            { value: "12:00", label: "12:00" },
                            { value: "13:00", label: "13:00" },
                            { value: "14:00", label: "14:00" },
                            { value: "15:00", label: "15:00" },
                            { value: "16:00", label: "16:00" },
                            { value: "17:00", label: "17:00" },
                            { value: "18:00", label: "18:00" },
                            { value: "19:00", label: "19:00" },
                            { value: "20:00", label: "20:00" },
                            { value: "21:00", label: "21:00" },
                            { value: "22:00", label: "22:00" },
                          ]}
                        />

                        <CustomSelect
                          label="Hasta"
                          name={`schedules.${index}.endTime`}
                          options={[
                            { value: "10:00", label: "10:00" },
                            { value: "11:00", label: "11:00" },
                            { value: "12:00", label: "12:00" },
                            { value: "13:00", label: "13:00" },
                            { value: "14:00", label: "14:00" },
                            { value: "15:00", label: "15:00" },
                            { value: "16:00", label: "16:00" },
                            { value: "17:00", label: "17:00" },
                            { value: "18:00", label: "18:00" },
                            { value: "19:00", label: "19:00" },
                            { value: "20:00", label: "20:00" },
                            { value: "21:00", label: "21:00" },
                            { value: "22:00", label: "22:00" },
                            { value: "23:00", label: "23:00" },
                          ]}
                        />

                        <CustomSelect
                          label="Tipo"
                          name={`schedules.${index}.type`}
                          options={[
                            { value: "DELIVERY", label: "Envío" },
                            { value: "PICKUP", label: "Retiro" },
                          ]}
                        />

                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            id={`schedules.${index}.isActive`}
                            name={`schedules.${index}.isActive`}
                            checked={schedule.isActive}
                            onChange={(e) =>
                              (values.schedules[index].isActive =
                                e.target.checked)
                            }
                            className="h-5 w-5 accent-green-600"
                          />
                          <label
                            htmlFor={`schedules.${index}.isActive`}
                            className="ml-2 text-sm"
                          >
                            Activo
                          </label>
                        </div>

                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => remove(index)}
                        >
                          <FaTrash />
                        </Button>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        push({
                          dayOfWeek: "Lunes",
                          startTime: "09:00",
                          endTime: "12:00",
                          type: ScheduleType.DELIVERY,
                          isActive: true,
                        })
                      }
                    >
                      <FaPlus className="mr-2 h-4 w-4" /> Añadir Horario
                    </Button>
                  </div>
                )}
              </FieldArray>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">
                Gestión de Horarios
              </h3>
              <FieldArray name="schedules">
                {({ remove, push }) => (
                  <div className="space-y-4">
                    {values.schedules.map((schedule, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-end p-3 bg-gray-50 rounded-md border"
                      >
                        <CustomInput
                          label="Día"
                          name={`schedules.${index}.dayOfWeek`}
                          type="text"
                        />
                        <CustomInput
                          label="Desde (HH:mm)"
                          name={`schedules.${index}.startTime`}
                          type="text"
                        />
                        <CustomInput
                          label="Hasta (HH:mm)"
                          name={`schedules.${index}.endTime`}
                          type="text"
                        />
                        <CustomSelect
                          label="Tipo"
                          name={`schedules.${index}.type`}
                          options={[
                            { value: "DELIVERY", label: "Envío" },
                            { value: "PICKUP", label: "Retiro" },
                          ]}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => remove(index)}
                        >
                          <FaTrash />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        push({
                          dayOfWeek: "Nuevo Día",
                          startTime: "09:00",
                          endTime: "20:00",
                          type: ScheduleType.DELIVERY,
                          isActive: true,
                        })
                      }
                    >
                      <FaPlus className="mr-2 h-4 w-4" /> Añadir Horario
                    </Button>
                  </div>
                )}
              </FieldArray>
            </div>

            <div className="pt-6 border-t">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}
