"use client";
import { Settings } from "@prisma/client";
import axios, { isAxiosError } from "axios";
import { toast } from "react-hot-toast";
import { Formik, Form, FieldArray, FormikHelpers } from "formik";
import * as Yup from "yup";
import { CustomInput } from "../ui/Input";
import { FaPlus, FaTrash } from "react-icons/fa";

// --- TIPOS ---
type PriceTier = { minQuantity: number; price: number };
type SettingsWithTiers = Settings & {
  priceTiers: PriceTier[];
};

interface SettingsPanelProps {
  initialSettings: SettingsWithTiers;
}

// Esquema de validación con Yup
const validationSchema = Yup.object({
  pricePerMaple: Yup.number().positive("Debe ser positivo").required("Requerido"),
  pricePerHalfDozen: Yup.number().positive("Debe ser positivo").nullable(),
  deliveryFee: Yup.number().min(0, "No puede ser negativo").required("Requerido"),
  priceTiers: Yup.array().of(
    Yup.object({
      minQuantity: Yup.number().positive("Debe ser > 0").required("Requerido"),
      price: Yup.number().positive("Debe ser > 0").required("Requerido"),
    })
  ),
});

// --- COMPONENTE PRINCIPAL ---
export function SettingsPanel({ initialSettings }: SettingsPanelProps) {
  
  // 1. Usamos 'FormikHelpers' para tipar correctamente los helpers
  const handleSubmit = async (
    values: SettingsWithTiers,
    { setSubmitting }: FormikHelpers<SettingsWithTiers>
  ) => {
    try {
      await axios.patch('/api/settings', values);
      toast.success("Configuración guardada con éxito.");
    } catch (error) { // 2. Manejamos el error de forma segura
      if (isAxiosError(error) && error.response) {
        toast.error(error.response.data?.message || "No se pudo guardar la configuración.");
      } else {
        toast.error("Ocurrió un error inesperado al guardar.");
      }
      console.error("Error updating settings:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="text-xl font-bold mb-6">Configuración del Negocio</h2>
      
      <Formik
        initialValues={initialSettings}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ values, isSubmitting }) => (
          <Form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CustomInput label="Precio por Maple ($)" name="pricePerMaple" type="number" />
              <CustomInput label="Precio por Media Docena ($)" name="pricePerHalfDozen" type="number" />
              <CustomInput label="Costo de Envío ($)" name="deliveryFee" type="number" />
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Descuentos por Cantidad de Maples</h3>
              <FieldArray name="priceTiers">
                {({ remove, push }) => (
                  <div className="space-y-4">
                    {values.priceTiers && values.priceTiers.length > 0 &&
                      values.priceTiers.map((tier, index) => (
                        <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-md border">
                          <div className="flex-1">
                            <CustomInput label="Cantidad Mínima" name={`priceTiers.${index}.minQuantity`} type="number" />
                          </div>
                          <div className="flex-1">
                            <CustomInput label="Precio por Maple ($)" name={`priceTiers.${index}.price`} type="number" />
                          </div>
                          <button type="button" onClick={() => remove(index)} className="self-end mb-2 p-2 text-red-500 hover:text-red-700">
                            <FaTrash />
                          </button>
                        </div>
                      ))}
                    <button type="button" onClick={() => push({ minQuantity: '', price: '' })} className="flex items-center gap-2 text-sm font-semibold text-neutral-800 hover:text-neutral-950">
                      <FaPlus /> Añadir Nivel de Descuento
                    </button>
                  </div>
                )}
              </FieldArray>
            </div>

            <div className="pt-6 border-t">
              <button type="submit" disabled={isSubmitting} className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-neutral-800 disabled:opacity-50">
                {isSubmitting ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}