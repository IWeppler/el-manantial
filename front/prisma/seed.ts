import { PrismaClient, Role, ScheduleType, ExpenseCategory } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Iniciando el proceso de seed...");

  // 1. Borrado de datos en orden lógico (hijos primero)
  console.log("🗑️  Limpiando la base de datos...");
  await prisma.priceTier.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.eggProduction.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.schedule.deleteMany({});
  await prisma.settings.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.stock.deleteMany({});
  console.log("✅ Datos antiguos eliminados.");

  // 2. Crear configuraciones y descuentos
  console.log("⚙️  Creando configuraciones del negocio...");
  const settings = await prisma.settings.create({
    data: {
      pricePerMaple: 8000,
      pricePerHalfDozen: 4500,
      deliveryFee: 1000,
      freeDeliveryThreshold: 24000,
      minimumOrderMaples: 1,
      businessName: "El Manantial",
      whatsappNumber: "5491122334455",
      pickupAddress: "Av. Siempre Viva 742",
    },
  });

  await prisma.priceTier.createMany({
    data: [
      { minQuantity: 3, price: 7000, settingsId: settings.id },
      { minQuantity: 5, price: 6500, settingsId: settings.id },
    ]
  });
  console.log("✅ Configuraciones y descuentos creados.");

  // 3. Crear horarios de ejemplo
  console.log("🗓️  Creando horarios de ejemplo...");
  await prisma.schedule.createMany({
    data: [
      { dayOfWeek: 'Lunes', startTime: '09:00', endTime: '20:00', type: ScheduleType.DELIVERY, isActive: true },
      { dayOfWeek: 'Miércoles', startTime: '09:00', endTime: '20:00', type: ScheduleType.DELIVERY, isActive: true },
      { dayOfWeek: 'Viernes', startTime: '10:00', endTime: '18:00', type: ScheduleType.PICKUP, isActive: true },
      { dayOfWeek: 'Sábado', startTime: '09:00', endTime: '13:00', type: ScheduleType.PICKUP, isActive: true },
    ],
  });
  console.log("✅ Horarios creados.");

  // 4. Crear stock inicial
  console.log("🥚 Creando stock inicial...");
  await prisma.stock.create({
    data: { mapleCount: 50 },
  });
  console.log("✅ Stock inicial establecido.");

  // 5. Crear usuarios administradores
  console.log("👤 Creando usuarios administradores...");
  const adminPassword = await hash('admin12345.', 12);

  const ignacio = await prisma.user.create({
    data: { name: 'Ignacio', phone: '1234567890', role: Role.ADMIN, hashedPassword: adminPassword },
  });
  const bautista = await prisma.user.create({
    data: { name: 'Bautista', phone: '1234567891', role: Role.ADMIN, hashedPassword: adminPassword },
  });
  const nicolas = await prisma.user.create({
    data: { name: 'Nicolas', phone: '1234567892', role: Role.ADMIN, hashedPassword: adminPassword },
  });
  
  console.log("✅ Administradores creados.");

  // 6. Crear datos de ejemplo para analíticas
  console.log("📊 Creando datos de ejemplo para analíticas...");
  await prisma.eggProduction.createMany({
    data: [
      { date: new Date(), quantity: 150, userId: ignacio.id },
      { date: new Date(new Date().setDate(new Date().getDate() - 1)), quantity: 145, userId: bautista.id },
    ]
  });

  await prisma.expense.createMany({
    data: [
      { date: new Date(), description: "Bolsa de alimento 50kg", amount: 25000, category: ExpenseCategory.ALIMENTO, userId: ignacio.id },
      { date: new Date(new Date().setDate(new Date().getDate() - 1)), description: "Combustible reparto", amount: 10000, category: ExpenseCategory.TRANSPORTE, userId: bautista.id },
    ]
  });
  console.log("✅ Datos de analíticas creados.");

  // --- Mensajes finales ---
  console.log("\n🎉 Seed completado exitosamente!");
  console.log("-----------------------------------------------");
  console.log(`🔑 Contraseña para todos los admins: admin12345.`);
  console.log("-----------------------------------------------");
  console.log("📱 Teléfonos de acceso:");
  console.log(`- ${ignacio.name}: ${ignacio.phone}`);
  console.log(`- ${bautista.name}: ${bautista.phone}`);
  console.log(`- ${nicolas.name}: ${nicolas.phone}`);
  console.log("-----------------------------------------------\n");
}

main()
  .catch(async (e) => {
    console.error("❌ Error durante el proceso de seed:", e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });