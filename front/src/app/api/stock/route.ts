import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const stock = await db.stock.findFirst();
    
    return NextResponse.json(stock || { mapleCount: 0 });

  } catch (error) {
    console.error("[STOCK_GET_ERROR]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const body = await request.json();
    const { amount } = body;

    if (typeof amount !== 'number') {
      return new NextResponse("La cantidad debe ser un número", { status: 400 });
    }

    const currentStock = await db.stock.findFirst();

    let updatedStock;

    if (!currentStock) {
      updatedStock = await db.stock.create({
        data: { mapleCount: Math.max(0, amount) },
      });
    } else {
      updatedStock = await db.stock.update({
        where: { id: currentStock.id },
        data: {
          mapleCount: {
            increment: amount,
          },
        },
      });
    }

    return NextResponse.json(updatedStock);

  } catch (error) {
    console.error("[STOCK_POST_ERROR]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}

