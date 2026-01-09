import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { z } from "zod";
import { db } from "../../../lib/db";

// 1. Define a schema for input validation using Zod
const registerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  phone: z
    .string()
    .regex(/^[0-9]{10,13}$/, "El número de teléfono no es válido."),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres."),
  address: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 2. Validate the request body against the schema
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, phone, password, address } = validation.data;

    // 3. Normalize the phone number and check for existing user
    const normalizedPhone = phone;
    const existingUser = await db.user.findUnique({
      where: { phone: normalizedPhone },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "El número de teléfono ya está registrado" },
        { status: 409 }
      );
    }

    // 4. Hash the password and create the user
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: {
        name,
        phone: normalizedPhone,
        address,
        hashedPassword,
        role: "USER",
      },
    });

    const { hashedPassword: _, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error("[REGISTER_POST_ERROR]", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
