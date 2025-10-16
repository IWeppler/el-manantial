import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { OrderStatus } from "@prisma/client";

// 1. Definimos la forma del cuerpo de la petición para mayor seguridad
interface PatchRequestBody {
  status: OrderStatus;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const session = await getServerSession(authOptions);
    
    // Asignamos el tipo a la variable 'body'
    const body: PatchRequestBody = await req.json();

    if (session?.user?.role !== "ADMIN") {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const { status: newStatus } = body;

    // Esta validación sigue siendo útil en tiempo de ejecución
    if (!newStatus || !Object.values(OrderStatus).includes(newStatus)) {
      return new NextResponse("Estado inválido", { status: 400 });
    }

    const updatedOrder = await db.$transaction(async (tx) => {
      const currentOrder = await tx.order.findUnique({
        where: { id: orderId },
      });

      if (!currentOrder) {
        throw new Error("Orden no encontrada.");
      }

      const isBecomingCancelled = currentOrder.status !== 'CANCELADO' && newStatus === 'CANCELADO';
      const isBeingReactivated = currentOrder.status === 'CANCELADO' && newStatus !== 'CANCELADO';

      if (isBecomingCancelled) {
        await tx.stock.updateMany({
          data: { mapleCount: { increment: currentOrder.mapleQuantity } },
        });
      }

      if (isBeingReactivated) {
        const stock = await tx.stock.findFirst();
        if (!stock || stock.mapleCount < currentOrder.mapleQuantity) {
          throw new Error("No hay suficiente stock para reactivar este pedido.");
        }
        await tx.stock.updateMany({
          data: { mapleCount: { decrement: currentOrder.mapleQuantity } },
        });
      }

      return tx.order.update({
        where: { id: orderId },
        data: { status: newStatus },
      });
    });

    return NextResponse.json(updatedOrder);

  } catch (error) {
    console.error("[ORDER_PATCH_ERROR]", error);

    if (error instanceof Error) {
      if (error.message.includes("stock para reactivar")) {
        return NextResponse.json({ message: error.message }, { status: 409 });
      }
       if (error.message.includes("Orden no encontrada")) {
        return NextResponse.json({ message: error.message }, { status: 404 });
      }
    }
    
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}