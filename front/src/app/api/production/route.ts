import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";

const productionSchema = z.object({
  date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "La fecha no es válida.",
  }),
  quantity: z.number().int().positive("La cantidad debe ser un número positivo."),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return new NextResponse("No autorizado", { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = productionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { date, quantity } = validation.data;

    const newProduction = await db.eggProduction.create({
      data: {
        date: new Date(date),
        quantity,
        userId: session.user.id, 
      },
    });

    return NextResponse.json(newProduction, { status: 201 });
  } catch (error) {
    console.error("[PRODUCTION_POST_ERROR]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}