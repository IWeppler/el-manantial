// app/page.tsx
import OrderForm from "../components/OrderForm";
import Image from "next/image";

// Mock de la sesión (sin cambios)
const getMockSession = async () => {
  const isLoggedIn = false;
  if (!isLoggedIn) return null;
  return { user: { name: "Ignacio" } };
};

export default async function HomePage() {
  const session = await getMockSession();

  return (
    <main className="min-h-screen bg-background">
      {/* Columna 1: Formulario con scroll y logo */}
      {/* 1. EL CAMBIO CLAVE: Quitamos 'items-center' de esta línea. */}
      {/* El contenido ahora se alineará arriba por defecto y el padding (p-8) le dará el espacio necesario. */}
      <div className="w-full md:w-[60%] h-screen md:overflow-y-auto flex justify-center py-8 md:p-12 scrollbar-hide">
        <div className="relative w-full max-w-md">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.jpg"
              alt="Logo del emprendimiento"
              height={80}
              width={80}
              className="rounded-full object-cover shadow-md"
            />
          </div>

          <OrderForm isLoggedIn={!!session} userName={session?.user?.name} />
        </div>
      </div>

      {/* Columna 2: Imagen fija (sin cambios) */}
      <div className="hidden md:block w-[40%] h-screen fixed top-0 right-0">
        <Image
          src="/Diseño.png"
          alt="Gallinas felices en un campo verde"
          layout="fill"
          objectFit="cover"
          priority
        />
      </div>
    </main>
  );
}
