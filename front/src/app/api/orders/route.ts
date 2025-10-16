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
  guestName: z.string().min(2, "El nombre es obligatorio."),
  guestPhone: z
    .string()
    .regex(/^(\+?549?)?\d{10,13}$/, "Número de WhatsApp no válido."),
  guestAddress: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();

    const validation = createOrderSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const {
      mapleQuantity,
      scheduleId,
      paymentMethod,
      guestName,
      guestPhone,
      guestAddress,
    } = validation.data;

    // Validación explícita de datos de invitado
    const isGuestOrder = !session?.user || session.user.role === "ADMIN";
    if (isGuestOrder && (!guestName || !guestPhone)) {
      return NextResponse.json(
        {
          message: "El nombre y el teléfono son obligatorios para este pedido.",
        },
        { status: 400 }
      );
    }

    const newOrder = await db.$transaction(async (tx) => {
      const settings = await tx.settings.findFirst({
        include: { priceTiers: true },
      });
      const stock = await tx.stock.findFirst();

      if (!settings || !stock) {
        throw new Error(
          "La configuración del negocio o el stock no han sido inicializados."
        );
      }
      if (mapleQuantity < settings.minimumOrderMaples) {
        throw new Error(
          `El pedido mínimo es de ${settings.minimumOrderMaples} maple(s).`
        );
      }
      if (stock.mapleCount < mapleQuantity) {
        throw new Error("No hay suficiente stock para completar el pedido.");
      }

      const schedule = await tx.schedule.findUnique({
        where: { id: scheduleId },
      });

      if (!schedule || !schedule.isActive) {
        throw new Error(
          "El horario seleccionado no es válido o no está activo."
        );
      }

      // --- CÁLCULO DE PRECIO SEGURO EN EL SERVIDOR ---
      let pricePerMaple = settings.pricePerMaple;
      const sortedTiers = [...settings.priceTiers].sort(
        (a, b) => b.minQuantity - a.minQuantity
      );
      const applicableTier = sortedTiers.find(
        (tier) => mapleQuantity >= tier.minQuantity
      );
      if (applicableTier) {
        pricePerMaple = applicableTier.price;
      }
      const subtotal = mapleQuantity * pricePerMaple;

      let deliveryFee = 0;
      if (
        schedule.type === ScheduleType.DELIVERY &&
        (!settings.freeDeliveryThreshold ||
          subtotal < settings.freeDeliveryThreshold)
      ) {
        deliveryFee = settings.deliveryFee;
      }
      const totalPrice = subtotal + deliveryFee;

      // Descontar stock
      await tx.stock.update({
        where: { id: stock.id },
        data: { mapleCount: { decrement: mapleQuantity } },
      });

      // --- 🛡️ LÓGICA DE AUTOR DE PEDIDO MÁS CLARA ---
      let orderAuthorData: {
        userId?: string;
        guestName?: string;
        guestPhone?: string;
        guestAddress?: string;
      };

      if (session?.user && session.user.role !== "ADMIN") {
        // Un cliente registrado hace un pedido para sí mismo
        orderAuthorData = { userId: session.user.id };
      } else {
        // Un admin crea un pedido para un invitado, o un invitado lo hace por su cuenta
        orderAuthorData = {
          guestName: guestName,
          guestPhone: guestPhone,
          guestAddress: guestAddress,
        };
      }

      const order = await tx.order.create({
        data: {
          mapleQuantity,
          totalPrice,
          paymentMethod,
          scheduleId,
          ...orderAuthorData, // Unimos los datos del autor de forma limpia
        },
        include: {
          schedule: true,
          user: true,
        },
      });

      return order;
    });

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error: unknown) {
    // --- MANEJO DE ERRORES SEGURO ---
    console.error("[ORDER_POST_ERROR]", error);
    if (error instanceof Error) {
      // Devolvemos errores de negocio específicos al frontend
      if (
        error.message.includes("stock") ||
        error.message.includes("horario") ||
        error.message.includes("pedido mínimo")
      ) {
        return NextResponse.json({ message: error.message }, { status: 409 });
      }
    }
    // Para cualquier otro error, un mensaje genérico
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
