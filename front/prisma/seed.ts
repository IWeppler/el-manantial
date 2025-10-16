import { PrismaClient, Role, ScheduleType } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando el proceso de seed...");

  // Borrado de datos
  await prisma.priceTier.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.schedule.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.stock.deleteMany({});
  await prisma.settings.deleteMany({});
  await prisma.eggProduction.deleteMany({});
  await prisma.expense.deleteMany({});
  console.log("Datos antiguos eliminados.");

  // 2. Configuraciones iniciales
  await prisma.settings.create({
    data: {
      pricePerMaple: 8000,
      deliveryFee: 500,
      freeDeliveryThreshold: 24000,
      minimumOrderMaples: 1,
      businessName: "El Manantial",
      whatsappNumber: "5491122334455",
      pickupAddress: "Av. Siempre Viva 742"
    },
  });
  console.log("Configuraciones iniciales del negocio creadas.");

  // 3. Horarios de ejemplo
  await prisma.schedule.createMany({
    data: [
      { dayOfWeek: 'Lunes', startTime: '09:00', endTime: '20:00', type: ScheduleType.DELIVERY, isActive: true },
      { dayOfWeek: 'Martes', startTime: '09:00', endTime: '20:00', type: ScheduleType.DELIVERY, isActive: true },
      { dayOfWeek: 'Miércoles', startTime: '09:00', endTime: '20:00', type: ScheduleType.DELIVERY, isActive: true },
      { dayOfWeek: 'Viernes', startTime: '09:00', endTime: '20:00', type: ScheduleType.PICKUP, isActive: true },
      { dayOfWeek: 'Sábado', startTime: '09:00', endTime: '13:00', type: ScheduleType.PICKUP, isActive: false },
    ],
  });
  console.log("Horarios de ejemplo creados.");

  // 4. Stock inicial
  await prisma.stock.create({
    data: {
      mapleCount: 100,
    },
  });
  console.log("Stock inicial establecido en 100.");

  // --- 5. MODIFICACIÓN: Crear 3 usuarios administradores ---
  const adminPassword = await hash('admin12345.', 12); // Usamos la misma contraseña para todos

  await prisma.user.createMany({
    data: [
      {
        name: 'Ignacio',
        phone: '1234567891',
        role: Role.ADMIN,
        hashedPassword: adminPassword,
      },
      {
        name: 'Bautista',
        phone: '1234567892',
        role: Role.ADMIN,
        hashedPassword: adminPassword,
      },
      {
        name: 'Nicolas',
        phone: '1234567893',
        role: Role.ADMIN,
        hashedPassword: adminPassword,
      },
    ],
  });
  
  // Mensajes de consola actualizados y claros
  console.log("Usuarios administradores creados con éxito.");
  console.log("-----------------------------------------------");
  console.log("Credenciales de Acceso (Contraseña: admin123)");
  console.log("- Ignacio: 1234567891");
  console.log("- Bautista: 1234567892");
  console.log("- Nicolas: 1234567893");
  console.log("-----------------------------------------------");

  console.log("Seed completado!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });