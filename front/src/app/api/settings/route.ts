// front/src/app/api/settings/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";

// Esquema de validación con Zod
const settingsSchema = z.object({
  pricePerMaple: z.number().positive(),
  pricePerHalfDozen: z.number().positive().optional().nullable(),
  deliveryFee: z.number().min(0),
  // ... puedes agregar el resto de los campos de settings aquí
  priceTiers: z.array(z.object({
      id: z.string().optional(),
      minQuantity: z.number().positive(),
      price: z.number().positive()
  })).optional()
});

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return new NextResponse("No autorizado", { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = settingsSchema.safeParse(body);
    
    if(!validation.success) {
      return NextResponse.json({ errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { priceTiers, ...settingsData } = validation.data;

    const currentSettings = await db.settings.findFirst();
    if (!currentSettings) {
      throw new Error("No se encontró la configuración para actualizar.");
    }
    
    // Usamos una transacción para actualizar todo a la vez
    const updatedSettings = await db.$transaction(async (tx) => {
      // 1. Actualizar los campos simples de Settings
      const mainSettings = await tx.settings.update({
        where: { id: currentSettings.id },
        data: settingsData,
      });

      // 2. Actualizar los PriceTiers (borrar los viejos y crear los nuevos)
      if (priceTiers) {
        await tx.priceTier.deleteMany({
          where: { settingsId: currentSettings.id },
        });

        await tx.priceTier.createMany({
          data: priceTiers.map(tier => ({
            minQuantity: tier.minQuantity,
            price: tier.price,
            settingsId: currentSettings.id,
          })),
        });
      }
      
      return mainSettings;
    });

    return NextResponse.json(updatedSettings);

  } catch (error) {
    console.error("[SETTINGS_PATCH_ERROR]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}