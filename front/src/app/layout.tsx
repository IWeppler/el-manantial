import "./globals.css";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Providers from "./providers";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | El nuevo Manantial",
    default: "El nuevo Manantial",
  },
  description: "Página Oficial del El nuevo Manantial.",
  openGraph: {
    title: "El nuevo Manantial",
    description: "Página Oficial del El nuevo Manantial.",
    url: "",
    siteName: "El nuevo Manantial",
    images: [
      {
        url: "",
        width: 1200,
        height: 630,
      },
    ],
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "El nuevo Manantial",
    description: "Página Oficial del El nuevo Manantial.",
    images: [""],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "El Nuevo Manantial",
    url: "https://el-manantial-two.vercel.app",
    logo: "https://el-manantial-two.vercel.app/logo.jpg",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Gobernador Crespo 1658",
      addressLocality: "Tostado",
      addressRegion: "Santa Fe",
      postalCode: "3060",
      addressCountry: "AR",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+5493491699012",
      contactType: "customer service",
    },
  };

  return (
    <html lang="es">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${jakarta.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
