import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcrypt";

const createClientSchema = z.object({
  name: z.string().min(2, "El nombre es requerido"),
  phone: z.string().min(6, "El teléfono es requerido"),
  address: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const body = await req.json();
    const { name, phone, address } = createClientSchema.parse(body);

    // 1. Verificar si ya existe el teléfono (evitar duplicados)
    const existingUser = await db.user.findUnique({
      where: { phone },
    });

    if (existingUser) {
      return new NextResponse("Ya existe un cliente con este teléfono", {
        status: 400,
      });
    }

    // 2. Generar contraseña dummy (necesario por el schema de Prisma)
    const hashedPassword = await bcrypt.hash(
      `CLIENTE_${phone}_${Date.now()}`,
      10
    );

    // 3. Crear el usuario con rol USER
    const newUser = await db.user.create({
      data: {
        name,
        phone,
        address: address || "",
        role: "USER",
        hashedPassword,
      },
    });

    return NextResponse.json(newUser);
  } catch (error) {
    console.error("[CLIENTS_POST]", error);
    return new NextResponse("Error interno al crear cliente", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query) return NextResponse.json([]);

    const users = await db.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { phone: { contains: query } },
        ],
        role: "USER",
      },
      take: 5,
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("[CLIENTS_GET]", error);
    return new NextResponse("Error al buscar", { status: 500 });
  }
}
