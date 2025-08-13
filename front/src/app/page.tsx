import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import OrderForm from "../components/OrderForm";
import Image from "next/image";
import { LogoutButton } from "../components/ui/Buttons";
import Link from "next/link";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  return (
    <main className="flex flex-col md:flex-row">
      <div
        className="w-full md:w-[60%] min-h-screen 
      bg-gradient-to-br from-amber-300 via-orange-300 to-red-400 
      md:bg-none md:bg-white 
      flex justify-center items-start p-4 pt-12 md:p-12 overflow-y-auto scrollbar-hide"
      >
        <div className="relative w-full max-w-md">
          {session && <LogoutButton />}

          <div className="bg-white rounded-xl shadow-lg p-6 md:bg-transparent md:shadow-none md:p-0">
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
            <p className="text-neutral-600 text-sm font-medium text-center mt-6">
              Desarrollado por{" "}
              <Link
                href="https://ignacioweppler.vercel.app/"
                target="_blank"
                className="text-primary font-semibold hover:underline"
              >
                Ignacio Weppler
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Columna 2: Imagen fija para escritorio */}
      <div className="hidden md:block w-[40%] h-screen fixed top-0 right-0 z-0">
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
