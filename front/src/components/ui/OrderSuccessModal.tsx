// src/components/ui/Modal.tsx (o SuccessModal.tsx)
"use client";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { Fragment, useState } from "react";
import {
  CheckCircleIcon,
  XMarkIcon,
  HomeIcon,
  CreditCardIcon,
  ClipboardDocumentIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";
import { FaWhatsapp } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { PaymentMethod, ScheduleType } from "@prisma/client";

interface OrderSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentMethod?: PaymentMethod;
  totalPrice?: number;
  guestName?: string;
  guestPhone?: string;
  isGuestOrder: boolean;
  deliveryType?: ScheduleType | "";
}

export default function OrderSuccessModal({
  isOpen,
  onClose,
  paymentMethod,
  totalPrice,
  isGuestOrder,
  guestName,
  guestPhone,
  deliveryType,
}: OrderSuccessModalProps) {
  const router = useRouter();
  const priceInPesos = totalPrice ? totalPrice / 100 : 0;

  // Estados para el feedback de copiado
  const [copied, setCopied] = useState<"cbu" | "alias" | null>(null);

  const CBU = process.env.NEXT_PUBLIC_MP_CBU;
  const ALIAS = process.env.NEXT_PUBLIC_MP_ALIAS;
  const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_CONTACT_PHONE;
  const PICKUP_ADDRESS = process.env.NEXT_PUBLIC_PICKUP_ADDRESS;

  const handleCopy = (textToCopy: string, type: "cbu" | "alias") => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCreateAccountClick = () => {
    sessionStorage.setItem(
      "guestDataForRegistration",
      JSON.stringify({ name: guestName, phone: guestPhone })
    );
    router.push("/register");
  };

  const isTransfer = paymentMethod === PaymentMethod.TRANSFER;
  const isCash = paymentMethod === PaymentMethod.CASH;
  const isPickup = deliveryType === ScheduleType.PICKUP;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild as={Fragment}>
          <div className="fixed inset-0 bg-black/70" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild as={Fragment}>
              <DialogPanel className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-8 text-left align-middle shadow-xl transition-all">
                <button
                  type="button"
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
                  onClick={onClose}
                >
                  <span className="sr-only">Cerrar</span>
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
                      contacto para coordinar.
                    </p>
                  </div>

                  {totalPrice && totalPrice > 0 && (
                    <div className="mt-4 w-full text-center">
                      <p className="text-sm text-gray-500">
                        Monto total a pagar:
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {/* ✅ 3. CORRECCIÓN DEL PRECIO */}
                        {(totalPrice || 0).toLocaleString("es-AR", {
                          style: "currency",
                          currency: "ARS",
                          minimumFractionDigits: 0,
                        })}
                      </p>
                    </div>
                  )}

                  {/* --- SECCIÓN DE PRÓXIMOS PASOS --- */}
                  <div className="mt-6 w-full rounded-lg bg-slate-50 p-4 border border-slate-200 text-left">
                    <h4 className="text-sm font-semibold text-gray-800 text-center mb-3">
                      Próximos Pasos
                    </h4>
                    <div className="space-y-4">
                      {/* Instrucción para Retiro */}
                      {isPickup && (
                        <div className="flex items-start">
                          <HomeIcon className="h-5 w-5 text-gray-500 mr-3 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-neutral-800">
                              Retirá tu pedido en:
                            </p>
                            <p className="text-sm font-medium text-neutral-700">
                              {PICKUP_ADDRESS}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* ✅ 4. Instrucción para Efectivo */}
                      {isCash && (
                        <div className="flex items-start">
                          <BanknotesIcon className="h-5 w-5 text-green-600 mr-3 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-neutral-800">
                              Pago en Efectivo:
                            </p>
                            <p className="text-sm text-neutral-700">
                              Por favor, tené listo el monto al momento de la
                              entrega o retiro.
                            </p>
                          </div>
                        </div>
                      )}

                      {paymentMethod === "TRANSFER" && (
                        <div
                          className={`flex items-start ${
                            deliveryType === "PICKUP"
                              ? "mt-4 pt-4 border-t"
                              : ""
                          }`}
                        >
                          <CreditCardIcon className="h-5 w-5 text-neutral-500 mr-3 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-neutral-800">
                              Datos para la transferencia:
                            </p>
                            <div className="mt-2 space-y-2 text-sm text-neutral-600">
                              <div className="flex items-center justify-between">
                                <p>
                                  <strong>CBU:</strong> {CBU}
                                </p>
                                <button
                                  onClick={() => handleCopy(CBU!, "cbu")}
                                  className="ml-2 text-gray-500 hover:text-gray-800"
                                >
                                  {copied === "cbu" ? (
                                    <span className="text-green-600 text-xs font-bold">
                                      ¡Copiado!
                                    </span>
                                  ) : (
                                    <ClipboardDocumentIcon className="h-5 w-5 border border-gray-300 rounded bg-white" />
                                  )}
                                </button>
                              </div>
                              <div className="flex items-center justify-between">
                                <p>
                                  <strong>Alias:</strong> {ALIAS}
                                </p>
                                <button
                                  onClick={() => handleCopy(ALIAS!, "alias")}
                                  className="ml-2 text-gray-500 hover:text-gray-800 cursor-pointer"
                                >
                                  {copied === "alias" ? (
                                    <span className="text-green-600 text-xs font-medium">
                                      ¡Copiado!
                                    </span>
                                  ) : (
                                    <ClipboardDocumentIcon className="h-5 w-5 border border-gray-300 rounded bg-white" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {isGuestOrder && (
                    <div className="mt-6 w-full text-center p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <p className="font-semibold text-amber-900">
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

                  <div className="mt-8 flex w-full items-center gap-3">
                    {paymentMethod === "TRANSFER" && (
                      <a
                        href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hola! Te envío el comprobante de mi pedido.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                      >
                        <FaWhatsapp size={18} />
                        Enviar Comprobante
                      </a>
                    )}
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
