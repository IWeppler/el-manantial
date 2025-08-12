// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const productData = [
  { name: "1 Maple (30)", value: "30", price: 800000 },
  { name: "2 Maples (60)", value: "60", price: 1600000 },
  { name: "3 Maples (90)", value: "90", price: 2400000 },
  { name: "4 Maples (120)", value: "120", price: 3200000 },
  { name: "5 Maples (150)", value: "150", price: 4000000 },
];

async function main() {
  console.log(`Start seeding ...`);
  for (const p of productData) {
    const product = await prisma.product.upsert({
      where: { value: p.value },
      update: {},
      create: p,
    });
    console.log(`Created/updated product with id: ${product.id}`);
  }
  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
