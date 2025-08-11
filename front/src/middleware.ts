// middleware.ts

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  // `withAuth` extiende el objeto `req` con el token del usuario.
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Si el usuario es ADMIN y está intentando ir a la página principal,
    // lo redirigimos a su dashboard.
    if (token?.role === "ADMIN" && pathname === "/") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Si el usuario es un USER normal y está intentando acceder al dashboard,
    // lo redirigimos a la página principal.
    if (token?.role === "USER" && pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  },
  {
    callbacks: {
      // Este callback se asegura de que el middleware solo se ejecute
      // si el token existe (es decir, si el usuario está logueado).
      authorized: ({ token }) => !!token,
    },
  }
);

// El config matcher define en qué rutas se ejecutará el middleware.
// En este caso, en la raíz ("/") y en cualquier ruta que empiece con "/dashboard".
export const config = {
  matcher: ["/", "/dashboard/:path*"],
};
