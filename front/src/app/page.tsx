import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import OrderForm from "../components/OrderForm";
import Image from "next/image";
import { LogoutButton } from "../components/ui/Buttons";
import Link from "next/link";
import { db } from "@/lib/db";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const [settings, schedules] = await Promise.all([
    db.settings.findFirst({ include: { priceTiers: true } }),
    db.schedule.findMany({ where: { isActive: true } }),
  ]);

  if (!settings || !schedules) {
    return <p>Sistema de pedidos no disponible.</p>;
  }

  return (
    <main className="flex flex-col md:flex-row">
      <div
        className="w-full md:w-[60%] min-h-screen 
      bg-gradient-to-br from-amber-300 via-orange-300 to-red-400 
      md:bg-none md:bg-white 
      flex justify-center items-start p-4 pt-12 md:p-12 overflow-y-auto scrollbar-hide"
      >
        <div className="relative w-full max-w-lg">
          {session && <LogoutButton />}
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.jpg"
              alt="Logo del emprendimiento"
              height={80}
              width={80}
              className="rounded-full object-cover"
            />
          </div>

          <OrderForm
            isLoggedIn={!!session?.user}
            userName={session?.user?.name}
            settings={settings}
            schedules={schedules}
          />
          <p className="text-neutral-500 text-sm font-medium text-center my-4">
            Desarrollado por{" "}
            <Link
              href="https://ignacioweppler.com/"
              target="_blank"
              className="text-primary hover:underline"
            >
              Ignacio Weppler
            </Link>
          </p>
        </div>
      </div>

      {/* Columna 2: Imagen fija */}
      <div className="hidden md:block w-[40%] h-screen fixed top-0 right-0 z-10">
        <Image
          src={session ? "/is-logged-eggs.png" : "/main.png"}
          alt="Gallinas felices en un campo verde"
          fill
          className="object-cover"
          sizes="40vw"
          priority
        />
      </div>
    </main>
  );
}
