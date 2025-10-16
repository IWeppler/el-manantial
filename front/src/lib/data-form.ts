const formatPrice = (price: number): string => {
  return price.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  });
};

export const productOptions = [
  { value: "30", label: `1 Maple (30) - ${formatPrice(8000)}`, price: 8000 },
  { value: "60", label: `2 Maples (60) - ${formatPrice(16000)}`, price: 16000 },
  { value: "90", label: `3 Maples (90) - ${formatPrice(21000)}`, price: 21000 },
  {
    value: "120",
    label: `4 Maples (120) - ${formatPrice(28000)}`,
    price: 28000,
  },
  {
    value: "150",
    label: `5 Maples (150) - ${formatPrice(32500)}`,
    price: 32500,
  },
];

export const deliveryTypeOptions = [
  { value: "PICKUP", label: "Retiro en el local" },
  { value: "DELIVERY", label: "Envío a domicilio" },
];

export const deliveryDayOptions = [
  { value: "LUNES", label: "Lunes" },
  { value: "MARTES", label: "Martes" },
  { value: "MIERCOLES", label: "Miércoles" },
  { value: "JUEVES", label: "Jueves" },
  { value: "VIERNES", label: "Viernes" },
  { value: "SABADO", label: "Sábado" },
  { value: "DOMINGO", label: "Domingo" },
];

export const deliveryTimeOptions = [
  { value: "T08_00", label: "08:00 hs" },
  { value: "T09_00", label: "09:00 hs" },
  { value: "T10_00", label: "10:00 hs" },
  { value: "T11_00", label: "11:00 hs" },
  { value: "T12_00", label: "12:00 hs" },
  { value: "T13_00", label: "13:00 hs" },
  { value: "T14_00", label: "14:00 hs" },
  { value: "T15_00", label: "15:00 hs" },
  { value: "T16_00", label: "16:00 hs" },
  { value: "T17_00", label: "17:00 hs" },
  { value: "T18_00", label: "18:00 hs" },
  { value: "T19_00", label: "19:00 hs" },
  { value: "T20_00", label: "20:00 hs" },
];

export const paymentMethodOptions = [
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
];
