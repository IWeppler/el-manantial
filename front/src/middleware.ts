// middleware.ts
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });
  const { pathname } = req.nextUrl;

  // Si un ADMIN logueado va a la home, lo llevamos al dashboard
  if (token?.role === "ADMIN" && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Si un USER logueado intenta ir al dashboard, lo devolvemos a la home
  if (token?.role === "USER" && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*"],
};
