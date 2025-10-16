import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";

const expenseSchema = z.object({
  date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "La fecha no es válida.",
  }),
  description: z.string().min(3, "La descripción es muy corta."),
  amount: z.number().positive("El monto debe ser un número positivo."),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return new NextResponse("No autorizado", { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = expenseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { date, description, amount } = validation.data;

    const newExpense = await db.expense.create({
      data: {
        date: new Date(date),
        description,
        amount,
        userId: session.user.id, 
      },
      include: {
        user: { select: { name: true } }
      }
    });

    return NextResponse.json(newExpense, { status: 201 });
  } catch (error) {
    console.error("[EXPENSE_POST_ERROR]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}