import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const stock = await db.stock.findFirst();
  return NextResponse.json(stock);
}

// Función para actualizar el stock
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const body = await request.json();
    const { newCount } = body;

    if (typeof newCount !== 'number' || newCount < 0) {
      return new NextResponse("Cantidad inválida", { status: 400 });
    }

    const currentStock = await db.stock.findFirst();
    if (!currentStock) {
      throw new Error("Registro de stock no encontrado.");
    }

    const updatedStock = await db.stock.update({
      where: { id: currentStock.id },
      data: { mapleCount: newCount },
    });

    return NextResponse.json(updatedStock);

  } catch (error) {
    console.error("[STOCK_PATCH_ERROR]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}
