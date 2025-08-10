"use client";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { Fragment } from "react";
import { CheckCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentMethod?: string;
  totalPrice?: number;
  guestName?: string;
  guestPhone?: string;
  isGuestOrder: boolean;
}

export default function SuccessModal({
  isOpen,
  onClose,
  paymentMethod,
  totalPrice,
  isGuestOrder,
  guestName,
  guestPhone,
}: SuccessModalProps) {
  const router = useRouter();

  const CBU = process.env.NEXT_PUBLIC_MP_CBU;
  const ALIAS = process.env.NEXT_PUBLIC_MP_ALIAS;
  const TELEFONO = process.env.NEXT_PUBLIC_CONTACT_PHONE;

  const handleCreateAccountClick = () => {
    // Guardamos los datos del invitado en el sessionStorage
    sessionStorage.setItem(
      "guestDataForRegistration",
      JSON.stringify({
        name: guestName,
        phone: guestPhone,
      })
    );
    // Redirigimos a la página de registro
    router.push("/register");
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-8 text-left align-middle shadow-xl transition-all">
                <button
                  type="button"
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
                  onClick={onClose}
                >
                  <span className="sr-only ">Cerrar</span>
                  <XMarkIcon className="h-6 w-6 cursor-pointer" />
                </button>

                <div className="flex flex-col items-center">
                  <CheckCircleIcon className="h-16 w-16 text-green-500" />

                  <DialogTitle
                    as="h3"
                    className="mt-4 text-2xl font-bold leading-6 text-gray-900"
                  >
                    ¡Pedido Realizado!
                  </DialogTitle>

                  <div className="mt-2">
                    <p className="text-sm text-gray-500 text-center">
                      Recibimos tu pedido correctamente. Nos pondremos en
                      contacto para coordinar la entrega.
                    </p>
                  </div>

                  {totalPrice && totalPrice > 0 && (
                    <div className="mt-4 w-full text-center">
                      <p className="text-sm text-gray-500">
                        Monto total a pagar:
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {totalPrice.toLocaleString("es-AR", {
                          style: "currency",
                          currency: "ARS",
                          minimumFractionDigits: 0,
                        })}
                      </p>
                    </div>
                  )}

                  {/* Información Condicional de Pago */}
                  {paymentMethod === "transferencia" && (
                    <div className="mt-6 w-full rounded-lg bg-slate-50 p-4 border border-slate-200">
                      <p className="text-sm font-semibold text-gray-800">
                        Datos para la transferencia:
                      </p>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-600">
                          <strong>CBU:</strong> {CBU}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Alias:</strong> {ALIAS}
                        </p>
                      </div>
                      <p className="mt-3 text-xs text-gray-700">
                        Por favor, envianos el comprobante por WhatsApp al{" "}
                        {TELEFONO} una vez realizado el pago.
                      </p>
                    </div>
                  )}

                  {/* 2. Bloque condicional para la invitación al registro */}
                  {isGuestOrder && (
                    <div className="mt-6 w-full text-center p-4 bg-accent/10 rounded-lg border border-accent">
                      <p className="font-semibold text-primary">
                        Hace tu próxima compra más rápida
                      </p>
                      <button
                        type="button"
                        className="mt-3 inline-flex justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-foreground cursor-pointer"
                        onClick={handleCreateAccountClick}
                      >
                        Crear mi cuenta
                      </button>
                    </div>
                  )}

                  <div className="mt-8">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-neutral-950 px-8 py-2 text-sm font-medium text-white cursor-pointer"
                      onClick={onClose}
                    >
                      Entendido
                    </button>
                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
