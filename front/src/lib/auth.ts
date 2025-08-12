// lib/auth.ts

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
        if (!credentials?.phone || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { phone: credentials.phone },
        });
        if (!user) return null;

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        );
        if (!passwordMatch) return null;

        return {
          id: user.id,
          name: user.name,
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
