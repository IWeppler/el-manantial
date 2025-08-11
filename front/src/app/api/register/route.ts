import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { db } from "../../../lib/db";
import { Role } from "@prisma/client";

export async function POST(request: Request) {
  try {
    // 1. Extraemos los datos del cuerpo de la petición
    const body = await request.json();
    const { name, phone, address, password } = body;

    // 2. Validamos que todos los campos necesarios estén presentes
    if (!name || !phone || !password) {
      return new NextResponse("Faltan datos obligatorios", { status: 400 });
    }

    // 3. Verificamos si ya existe un usuario con ese número de teléfono
    const existingUser = await db.user.findUnique({
      where: { phone: phone },
    });

    if (existingUser) {
      return new NextResponse("El número de teléfono ya está registrado", {
        status: 409,
      }); // 409 Conflict
    }

    // 4. Hasheamos (encriptamos) la contraseña antes de guardarla
    const hashedPassword = await bcrypt.hash(password, 12);

    // 5. Creamos el nuevo usuario en la base de datos usando Prisma
    const userRole: Role =
      phone === process.env.ADMIN_PHONE ? Role.ADMIN : Role.USER;

    const user = await db.user.create({
      data: {
        name,
        phone,
        address,
        hashedPassword,
        role: userRole,
      },
    });

    // 6. Retornamos el usuario creado (sin la contraseña) con un estado 201 (Created)
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("[REGISTER_POST_ERROR]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}
