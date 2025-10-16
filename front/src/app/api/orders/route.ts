import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { PaymentMethod, ScheduleType } from "@prisma/client";

// 1. Definir un esquema para validación robusta de entrada
const createOrderSchema = z.object({
  mapleQuantity: z
    .number()
    .int()
    .positive("La cantidad debe ser un número positivo."),
  scheduleId: z.string().cuid("El ID del horario no es válido."),
  paymentMethod: z
    .nativeEnum(PaymentMethod)
    .refine((val) => Object.values(PaymentMethod).includes(val), {
      message: "Método de pago no válido.",
    }),
  guestName: z.string().optional(),
  guestPhone: z.string().optional(),
  guestAddress: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();

    const validation = createOrderSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    // Validación de invitado (solo si no hay sesión, o si el que pide no es admin)
    if (!session?.user) {
      if (!validation.data.guestName || !validation.data.guestPhone) {
        return NextResponse.json({ message: "El nombre y el teléfono son obligatorios para invitados." }, { status: 400 });
      }
    }

    const { mapleQuantity, scheduleId, paymentMethod, guestName, guestPhone, guestAddress } = validation.data;

    const newOrder = await db.$transaction(async (tx) => {

      // Fetch business settings and current stock
      const settings = await tx.settings.findFirst({
        include: { priceTiers: true }
      });
      const stock = await tx.stock.findFirst();

      if (!settings || !stock) {
        throw new Error("La configuración del negocio o el stock no han sido inicializados.");
      }

      // Business logic validation
      if (mapleQuantity < settings.minimumOrderMaples) {
        throw new Error(
          `El pedido mínimo es de ${settings.minimumOrderMaples} maple(s).`
        );
      }
      if (stock.mapleCount < mapleQuantity) {
        throw new Error("No hay suficiente stock para completar el pedido.");
      }

      // 4. Calculate total price dynamically
      const schedule = await tx.schedule.findUnique({ where: { id: scheduleId } });
      if (!schedule || !schedule.isActive) {
        throw new Error("El horario seleccionado no es válido o no está activo.");
      }

      // --- CÁLCULO DE PRECIO SEGURO EN EL SERVIDOR ---
      let pricePerMaple = settings.pricePerMaple;
      // Ordenamos los descuentos de mayor a menor cantidad para encontrar el aplicable
      const sortedTiers = [...settings.priceTiers].sort((a, b) => b.minQuantity - a.minQuantity);
      const applicableTier = sortedTiers.find(tier => mapleQuantity >= tier.minQuantity);
      if (applicableTier) {
        pricePerMaple = applicableTier.price;
      }
      const subtotal = mapleQuantity * pricePerMaple;

      let deliveryFee = 0;
      if (schedule.type === ScheduleType.DELIVERY && (!settings.freeDeliveryThreshold || subtotal < settings.freeDeliveryThreshold)) {
        deliveryFee = settings.deliveryFee;
      }
      const totalPrice = subtotal + deliveryFee;

      // 5. Decrease stock
      await tx.stock.update({
        where: { id: stock.id },
        data: { mapleCount: { decrement: mapleQuantity } },
      });

      // 6. Create the order
      const order = await tx.order.create({
        data: {
          mapleQuantity,
          totalPrice,
          paymentMethod,
          scheduleId,
          // --- 🛡️ LÓGICA  PARA USUARIO/INVITADO ---
          userId: session?.user?.role !== 'ADMIN' ? session?.user?.id : undefined,
          guestName: session?.user?.role === 'ADMIN' ? guestName : (session?.user ? undefined : guestName),
          guestPhone: session?.user?.role === 'ADMIN' ? guestPhone : (session?.user ? undefined : guestPhone),
          guestAddress: session?.user?.role === 'ADMIN' ? guestAddress : (session?.user ? undefined : guestAddress),
        },
        include: {
          schedule: true,
          user: true, // Incluimos para que la respuesta sea completa
        },
      });

      return order;
    });

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    console.error("[ORDER_POST_ERROR]", error);
    if (
      error instanceof Error &&
      (error.message.includes("stock") ||
        error.message.includes("horario") ||
        error.message.includes("pedido mínimo"))
    ) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
