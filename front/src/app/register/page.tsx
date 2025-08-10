import { RegisterForm } from "../../components/RegisterForm";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen bg-white">
      <div className="w-full md:w-[50%] h-screen md:overflow-y-auto flex justify-center items-center py-8 md:p-12 scrollbar-hide">
        <div className="relative w-full max-w-md">
          <div className="flex justify-center mb-4">
            <Link href="/">
              <Image
                src="/logo.jpg"
                alt="Logo del emprendimiento"
                height={80}
                width={80}
                className="rounded-full object-cover"
              />
            </Link>
          </div>

          <RegisterForm />
        </div>
      </div>
      <div className="hidden md:block w-[50%] h-screen fixed top-0 right-0">
        <Image
          src="/chickens.webp"
          alt="Gallinas felices en un campo verde"
          layout="fill"
          objectFit="cover"
          priority
        />
      </div>
    </main>
  );
}
