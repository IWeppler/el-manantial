import { ExpenseCategory } from "@prisma/client";

// Definimos las opciones para el select de categorías de gastos
export const categoryOptions = [
  { value: ExpenseCategory.ALIMENTO, label: 'Alimento' },
  { value: ExpenseCategory.TRANSPORTE, label: 'Transporte' },
  { value: ExpenseCategory.MANTENIMIENTO, label: 'Mantenimiento' },
  { value: ExpenseCategory.INSUMOS, label: 'Insumos' },
  { value: ExpenseCategory.OTROS, label: 'Otros' },
];