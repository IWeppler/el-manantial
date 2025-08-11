import { getServerSession } from "next-auth";
import OrderForm from "../components/OrderForm";
import Image from "next/image";
import { LogoutButton } from "../components/ui/Buttons";

export default async function HomePage() {
  const session = await getServerSession();

  return (
    <main className="min-h-screen">
      {/* Columna 1: Formulario con scroll y logo */}
      <div className="w-full md:w-[60%] h-screen md:overflow-y-auto flex justify-center py-8 md:p-12 scrollbar-hide">
        <div className="relative w-full max-w-md">
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
            isLoggedIn={!!session}
            userName={session?.user?.name ?? "Cliente"}
          />
        </div>
      </div>

      {/* Columna 2: Imagen fija (sin cambios) */}
      <div className="hidden md:block w-[40%] h-screen fixed top-0 right-0 z-10">
        <Image
          // Aquí está la lógica condicional para la imagen
          src={session ? "/is-logged-eggs.png" : "/main.png"}
          alt="Gallinas felices en un campo verde"
          layout="fill"
          objectFit="cover"
          priority
        />
      </div>
    </main>
  );
}
