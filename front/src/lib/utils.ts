export const normalizePhoneNumber = (phone: string): string => {
  // 1. Eliminar todos los caracteres que no sean dígitos
  let cleaned = phone.replace(/\D/g, '');

  // 2. Manejar casos comunes de Argentina
  // Si empieza con "549" y tiene 12 dígitos (ej: 5493491...), ya está casi listo.
  if (cleaned.startsWith('549') && cleaned.length === 12) {
    return cleaned;
  }
  
  // Si empieza con "0" (ej: 03491...), se le quita el 0 y se le añade "549"
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  // Si tiene 10 dígitos (ej: 3491...), es un número local sin el 9. Le añadimos "549".
  if (cleaned.length === 10) {
    return `549${cleaned}`;
  }

  // Si después de limpiar tiene 11 dígitos y empieza con 9 (ej: 93491...), le añadimos "54"
  if (cleaned.length === 11 && cleaned.startsWith('9')) {
    return `54${cleaned}`;
  }

  // Si no coincide con los patrones, devolvemos el número limpio como último recurso
  return cleaned;
};