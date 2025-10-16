import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { ScheduleType } from "@prisma/client";

const scheduleSchema = z.object({
  dayOfWeek: z.enum(["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"]),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora inválido (HH:MM)"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora inválido (HH:MM)"),
  type: z.nativeEnum(ScheduleType),
  isActive: z.boolean(),
});

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return new NextResponse("No autorizado", { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = z.array(scheduleSchema).safeParse(body.schedules);
    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { settingsId, schedules } = body;

    await db.$transaction(async (tx) => {
      // Borramos todos los horarios viejos
      await tx.schedule.deleteMany({});
      // Creamos los nuevos
      await tx.schedule.createMany({
        data: schedules,
      });
    });

    return NextResponse.json({ message: "Horarios actualizados con éxito." });
  } catch (error) {
    console.error("[SCHEDULES_PATCH_ERROR]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}