import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "../../../../lib/db";
import bcrypt from "bcrypt";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        phone: { label: "Teléfono", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        // Asegurarnos que las credenciales no son nulas
        if (!credentials?.phone || !credentials?.password) {
          return null;
        }

        // 1. Buscar al usuario en la base de datos por su teléfono.
        const user = await db.user.findUnique({
          where: { phone: credentials.phone },
        });

        // 2. Si no se encuentra el usuario, retornar null.
        if (!user) {
          return null;
        }

        // 3. Comparar la contraseña ingresada con la hasheada en la DB.
        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        );

        // 4. Si la contraseña no coincide, retornar null.
        if (!passwordMatch) {
          return null;
        }

        // 5. Si todo es correcto, retornar el objeto de usuario.
        // NextAuth usará esto para crear la sesión.
        return {
          id: user.id,
          name: user.name,
          phone: user.phone,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
});

export { handler as GET, handler as POST };
