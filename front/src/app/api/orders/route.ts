import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { DeliveryType, PaymentMethod, DeliveryTime } from "@prisma/client";
import { authOptions } from "@/lib/auth";

const SHIPPING_COST_CENTS = 50000;
const FREE_SHIPPING_THRESHOLD_MAPLES = 3;

const mapToEnum = <T extends object>(
  enumObject: T,
  value: string
): T[keyof T] => {
  const specialMappings: { [key: string]: string } = {
    pickup: "RETIRO_EN_LOCAL",
    delivery: "ENVIO_A_DOMICILIO",
  };

  const mappedValue = specialMappings[value] || value;

  const key = mappedValue.toUpperCase().replace(":", "_") as keyof T;
  if (key in enumObject) {
    return enumObject[key];
  }
  throw new Error(`Valor inválido "${value}" para el enum.`);
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const {
      product: productValue,
      deliveryType,
      deliveryDay,
      deliveryTime,
      paymentMethod,
      name,
      phone,
      address,
    } = body;

    const productFromDb = await db.product.findUnique({
      where: { value: productValue },
    });

    if (!productFromDb) {
      return new NextResponse("Producto no encontrado", { status: 404 });
    }

    let shippingCost = 0;
    const mappedDeliveryType = mapToEnum(DeliveryType, deliveryType);

    if (mappedDeliveryType === "ENVIO_A_DOMICILIO") {
      const maples = parseInt(productFromDb.value, 10) / 30;
      if (maples < FREE_SHIPPING_THRESHOLD_MAPLES) {
        shippingCost = SHIPPING_COST_CENTS;
      }
    }

    const totalPrice = productFromDb.price + shippingCost;
    let newOrder;

    const mappedPaymentMethod = mapToEnum(PaymentMethod, paymentMethod);
    const mappedDeliveryTime = mapToEnum(DeliveryTime, deliveryTime);

    if (session?.user?.id) {
      // --- CASO 1: El usuario está LOGUEADO ---
      newOrder = await db.order.create({
        data: {
          user: { connect: { id: session.user.id } },
          product: { connect: { id: productFromDb.id } },
          totalPrice: totalPrice,
          deliveryType: mappedDeliveryType,
          deliveryDay,
          deliveryTime: mappedDeliveryTime,
          paymentMethod: mappedPaymentMethod,
        },
      });
    } else {
      // --- CASO 2: El usuario es un INVITADO ---
      if (!name || !phone) {
        return new NextResponse(
          "Faltan nombre y teléfono para el pedido de invitado",
          { status: 400 }
        );
      }
      newOrder = await db.order.create({
        data: {
          guestName: name,
          guestPhone: phone,
          guestAddress: address,
          product: { connect: { id: productFromDb.id } },
          totalPrice,
          deliveryType: mappedDeliveryType,
          deliveryDay,
          deliveryTime: mappedDeliveryTime,
          paymentMethod: mappedPaymentMethod,
        },
      });
    }

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    console.error("[ORDER_POST_ERROR]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}
