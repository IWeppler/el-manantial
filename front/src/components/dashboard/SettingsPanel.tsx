"use client";
import { Schedule, Settings, ScheduleType } from "@prisma/client";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Formik, Form, FieldArray, FormikHelpers } from "formik";
import { FaPlus, FaTrash } from "react-icons/fa";
import { CustomInput } from "../ui/CustomInput";
import { CustomSelect } from "../ui/CustomSelect";
import { Button } from "../ui/button";

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

interface ScheduleManagerProps {
  type: ScheduleType;
  schedules: Schedule[];
  push: (obj: Partial<Schedule>) => void;
  remove: (index: number) => void;
}

// --- SUB-COMPONENTE REUTILIZABLE PARA GESTIÓN DE HORARIOS ---
const ScheduleManager = ({ type, schedules, push, remove }: ScheduleManagerProps) => {
  const title = type === ScheduleType.DELIVERY ? "Horarios de Envío" : "Horarios de Retiro";

  const dayOptions = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].map(d => ({ value: d, label: d }));
  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return { value: `${hour}:00`, label: `${hour}:00` };
  });

  return (
    <div className="border-t pt-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="space-y-4">
        {schedules.map((schedule, index) => 
          schedule.type === type && (
            <div key={index} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end p-3 bg-gray-50 rounded-md border">
              <CustomSelect label="Día" name={`schedules.${index}.dayOfWeek`} options={dayOptions} />
              <CustomSelect label="Desde" name={`schedules.${index}.startTime`} options={timeOptions} />
              <CustomSelect label="Hasta" name={`schedules.${index}.endTime`} options={timeOptions} />
              <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                <FaTrash />
              </Button>
            </div>
          )
        )}
        <Button type="button" variant="outline" onClick={() => push({ dayOfWeek: 'Lunes', startTime: '09:00', endTime: '12:00', type })}>
          <FaPlus className="mr-2 h-4 w-4" /> Añadir Horario de {type === ScheduleType.DELIVERY ? "Envío" : "Retiro"}
        </Button>
      </div>
    </div>
  );
};


// --- COMPONENTE PRINCIPAL ---
export function SettingsPanel({ initialSettings, initialSchedules }: SettingsPanelProps) {
  
  const handleSubmit = async (values: SettingsFormValues, { setSubmitting }: FormikHelpers<SettingsFormValues>) => {
    try {
      await Promise.all([
        axios.patch('/api/settings', values.settings),
        axios.patch('/api/schedules', { schedules: values.schedules })
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
        initialValues={{ settings: initialSettings, schedules: initialSchedules }}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ values, isSubmitting }) => (
          <Form className="space-y-6">
            <div>
              <h3 className="text-xl font-bold mb-4">Precios Generales</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <CustomInput label="Precio por Maple ($)" name="settings.pricePerMaple" type="number" />
                <CustomInput label="Precio por Media Docena ($)" name="settings.pricePerHalfDozen" type="number" />
                <CustomInput label="Costo de Envío ($)" name="settings.deliveryFee" type="number" />
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Descuentos por Cantidad de Maples</h3>
              <FieldArray name="settings.priceTiers">
                {({ remove, push }) => (
                  <div className="space-y-4">
                    {values.settings.priceTiers.map((tier, index) => (
                      <div key={index} className="flex items-end gap-4 p-3 bg-gray-50 rounded-md border">
                        <CustomInput label="Cantidad Mínima" name={`settings.priceTiers.${index}.minQuantity`} type="number" />
                        <CustomInput label="Precio por Maple ($)" name={`settings.priceTiers.${index}.price`} type="number" />
                        <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                          <FaTrash />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={() => push({ minQuantity: '', price: '' })}>
                      <FaPlus className="mr-2 h-4 w-4" /> Añadir Descuento
                    </Button>
                  </div>
                )}
              </FieldArray>
            </div>

            <h2 className="text-xl font-bold mb-4 border-t pt-6">Gestión de Horarios</h2>
            <FieldArray name="schedules">
              {({ remove, push }) => (
                <div className="space-y-8">
                  <ScheduleManager type={ScheduleType.DELIVERY} schedules={values.schedules} push={push} remove={remove} />
                  <ScheduleManager type={ScheduleType.PICKUP} schedules={values.schedules} push={push} remove={remove} />
                </div>
              )}
            </FieldArray>
            
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