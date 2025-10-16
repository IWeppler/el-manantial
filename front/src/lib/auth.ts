import { type NextAuthOptions, type DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import bcrypt from "bcrypt";
import { Role } from "@prisma/client";

// Declaraciones de tipos para extender NextAuth
declare module "next-auth" {
  interface Session {
    user: { id: string; role: Role } & DefaultSession["user"];
  }
  interface User {
    role: Role;
  }
}
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}

// Exportamos la configuración desde este archivo
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        phone: { label: "Teléfono", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.password) {
          console.log("❌ Faltan credenciales");
          return null;
        }

        // const normalizedPhone = normalizePhoneNumber(credentials.phone);
        // console.log("📞 Intentando login con:", normalizedPhone);

        const user = await db.user.findUnique({
          where: { phone: credentials.phone },
        });
        if (!user) {
          console.log("❌ Usuario no encontrado");
          return null;
        }

        console.log("✅ Usuario encontrado:", user.phone);

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        );
        if (!passwordMatch) {
          console.log("❌ Contraseña incorrecta");
          return null;
        }

        console.log("✅ Login correcto");
        return {
          id: user.id,
          name: user.name,
          email: null,
          image: null,
          phone: user.phone,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
};
