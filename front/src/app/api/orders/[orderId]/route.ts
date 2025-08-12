import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { OrderStatus } from "@prisma/client";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    // 👇 await params antes de usarlos
    const { orderId } = await context.params;

    const [session, body] = await Promise.all([
      getServerSession(authOptions),
      req.json(),
    ]);

    if (session?.user?.role !== "ADMIN") {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const { status } = body;

    if (!status || !Object.values(OrderStatus).includes(status)) {
      return new NextResponse("Estado inválido", { status: 400 });
    }

    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: { status },
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("[ORDER_PATCH_ERROR]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}
