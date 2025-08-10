import OrderForm from "../components/OrderForm";
import Image from "next/image";

const getMockSession = async () => {
  const isLoggedIn = false;
  if (!isLoggedIn) return null;
  return { user: { name: "Ignacio" } };
};

export default async function HomePage() {
  const session = await getMockSession();

  return (
    <main className="min-h-screen bg-white">
      {/* Columna 1: Formulario con scroll y logo */}
      <div className="w-full md:w-[60%] h-screen md:overflow-y-auto flex justify-center py-8 md:p-12 scrollbar-hide">
        <div className="relative w-full max-w-md">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.jpg"
              alt="Logo del emprendimiento"
              height={80}
              width={80}
              className="rounded-full object-cover"
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
