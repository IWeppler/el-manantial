"use client";

import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useForm } from "react-hook-form";
import { X, Loader2, User, Phone, MapPin } from "lucide-react";
import { toast } from "react-hot-toast";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";

interface CreateClientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ClientFormData = {
  name: string;
  phone: string;
  address: string;
};

export function CreateClientModal({ isOpen, onClose }: CreateClientModalProps) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<ClientFormData>();

  const onSubmit = async (data: ClientFormData) => {
    try {
      // Llamada real a la API
      await axios.post("/api/clients", data);

      toast.success("Cliente guardado correctamente");
      reset();
      router.refresh(); // Refrescar para que si hay listas se actualicen
      onClose();
    } catch (error) {
      console.error(error);
      const err = error as AxiosError<{ message?: string }>; // Tipamos el error como AxiosError
      
      if (err.response?.status === 400) {
        toast.error("Ese número de teléfono ya está registrado.");
      } else {
        toast.error("Error al guardar el cliente.");
      }
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop con Blur */}
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
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-[#18181b] border border-white/10 p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-bold text-white flex items-center gap-2"
                  >
                    <div className="p-1.5 rounded bg-indigo-500/10 text-indigo-400">
                      <User size={18} />
                    </div>
                    Nuevo Cliente
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-zinc-500 hover:text-white transition-colors p-1 rounded hover:bg-white/5"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  
                  {/* Nombre */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-400 ml-1">
                      Nombre Completo
                    </label>
                    <div className="relative">
                      <input
                        {...register("name", { required: "Requerido" })}
                        className="w-full bg-[#0f0f11] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none placeholder:text-zinc-600 transition-all"
                        placeholder="Ej: Maria Lopez"
                      />
                      <User className="absolute left-3 top-2.5 text-zinc-500 w-4 h-4" />
                    </div>
                    {errors.name && (
                      <p className="text-red-400 text-xs ml-1">{errors.name.message}</p>
                    )}
                  </div>

                  {/* Teléfono */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-400 ml-1">
                      Teléfono (ID Único)
                    </label>
                    <div className="relative">
                      <input
                        {...register("phone", { required: "Requerido" })}
                        className="w-full bg-[#0f0f11] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none placeholder:text-zinc-600 transition-all"
                        placeholder="3491..."
                      />
                      <Phone className="absolute left-3 top-2.5 text-zinc-500 w-4 h-4" />
                    </div>
                    {errors.phone && (
                      <p className="text-red-400 text-xs ml-1">{errors.phone.message}</p>
                    )}
                  </div>

                  {/* Dirección */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-400 ml-1">
                      Dirección (Opcional)
                    </label>
                    <div className="relative">
                      <input
                        {...register("address")}
                        className="w-full bg-[#0f0f11] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none placeholder:text-zinc-600 transition-all"
                        placeholder="Dirección..."
                      />
                      <MapPin className="absolute left-3 top-2.5 text-zinc-500 w-4 h-4" />
                    </div>
                  </div>

                  {/* Botón Submit */}
                  <div className="pt-4">
                    <button
                      disabled={isSubmitting}
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-lg shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <Loader2 className="animate-spin w-5 h-5" />
                      ) : (
                        "Guardar Cliente"
                      )}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}