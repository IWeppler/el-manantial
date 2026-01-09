import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { PaymentMethod, ScheduleType, Prisma } from "@prisma/client";

const createOrderSchema = z.object({
  mapleQuantity: z
    .number()
    .int()
    .positive("La cantidad debe ser un número positivo."),
  scheduleId: z.string().cuid("El ID del horario no es válido.").optional(),
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

    const isAdmin = session?.user?.role === "ADMIN";

    // --- VALIDACIONES DE REGLAS DE NEGOCIO ---

    if (!scheduleId && !isAdmin) {
      return NextResponse.json(
        {
          message:
            "Es obligatorio seleccionar un horario para realizar el pedido.",
        },
        { status: 400 }
      );
    }

    const isGuestOrder = !session?.user || isAdmin;

    if (isGuestOrder && (!guestName || !guestPhone)) {
      return NextResponse.json(
        { message: "El nombre y el teléfono son obligatorios." },
        { status: 400 }
      );
    }

    const newOrder = await db.$transaction(async (tx) => {
      const settings = await tx.settings.findFirst({
        include: { priceTiers: true },
      });
      const stock = await tx.stock.findFirst();

      if (!settings || !stock) {
        throw new Error("Configuración o stock no inicializados.");
      }

      if (!isAdmin && mapleQuantity < settings.minimumOrderMaples) {
        throw new Error(
          `El pedido mínimo es de ${settings.minimumOrderMaples} maple(s).`
        );
      }

      if (stock.mapleCount < mapleQuantity) {
        throw new Error("No hay suficiente stock.");
      }

      // --- MANEJO DEL HORARIO (SCHEDULE) ---
      let schedule = null;
      if (scheduleId) {
        schedule = await tx.schedule.findUnique({ where: { id: scheduleId } });
        if (!schedule || !schedule.isActive) {
          throw new Error("El horario seleccionado no es válido.");
        }
      }

      // --- CÁLCULO DE PRECIO ---
      let pricePerMaple = settings.pricePerMaple;
      const sortedTiers = [...settings.priceTiers].sort(
        (a, b) => b.minQuantity - a.minQuantity
      );
      const applicableTier = sortedTiers.find(
        (tier) => mapleQuantity >= tier.minQuantity
      );
      if (applicableTier) pricePerMaple = applicableTier.price;

      const subtotal = mapleQuantity * pricePerMaple;

      let deliveryFee = 0;

      if (
        schedule &&
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

      // --- CONSTRUCCIÓN DEL OBJETO DE DATOS ---
      // 1. Datos base
      const baseData = {
        mapleQuantity,
        totalPrice,
        paymentMethod,
      };

      // 2. Datos del autor (Usuario vs Invitado)
      let authorData: Partial<Prisma.OrderUncheckedCreateInput> = {};
      if (session?.user && !isAdmin) {
        authorData = { userId: session.user.id };
      } else {
        // Usamos undefined en lugar de chequeos if para ser más concisos,
        // Prisma ignora los undefined en create inputs.
        authorData = {
          guestName: guestName || undefined,
          guestPhone: guestPhone || undefined,
          guestAddress: guestAddress || undefined,
        };
      }

      // 3. Unimos todo y forzamos el tipo Unchecked para evitar errores de TS con opcionales
      const orderData = {
        ...baseData,
        ...authorData,
        // Si scheduleId existe lo ponemos, si no, undefined
        scheduleId: scheduleId || undefined,
      } as Prisma.OrderUncheckedCreateInput;

      const order = await tx.order.create({
        data: orderData,
        include: {
          schedule: true,
          user: true,
        },
      });

      return order;
    });

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error: unknown) {
    console.error("[ORDER_POST_ERROR]", error);

    if (error instanceof Error) {
      if (
        error.message.includes("stock") ||
        error.message.includes("horario") ||
        error.message.includes("pedido mínimo")
      ) {
        return NextResponse.json({ message: error.message }, { status: 409 });
      }
    }

    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
