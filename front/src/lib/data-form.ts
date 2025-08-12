// app/lib/data-form.ts

const formatPrice = (price: number) => {
  return price.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  });
};

export const productOptions = [
  { value: "30", label: `1 Maple (30) - ${formatPrice(8000)}`, price: 8000 },
  { value: "60", label: `2 Maples (60) - ${formatPrice(16000)}`, price: 16000 },
  { value: "90", label: `3 Maples (90) - ${formatPrice(24000)}`, price: 24000 },
  {
    value: "120",
    label: `4 Maples (120) - ${formatPrice(32000)}`,
    price: 32000,
  },
  {
    value: "150",
    label: `5 Maples (150) - ${formatPrice(40000)}`,
    price: 40000,
  },
];

export const deliveryTypeOptions = [
  { value: "pickup", label: "Retiro en el local" },
  { value: "delivery", label: "Envío a domicilio" },
  
];

export const deliveryDayOptions = [
  { value: "miercoles", label: "Miércoles" },
  { value: "sabado", label: "Sábado" },
];

export const deliveryTimeOptions = [
  { value: "T13_00", label: "13:00 hs" },
  { value: "T20_00", label: "20:00 hs" },
]

export const paymentMethodOptions = [
  { value: "efectivo", label: "Efectivo" },
  { value: "transferencia", label: "Transferencia" },
];
