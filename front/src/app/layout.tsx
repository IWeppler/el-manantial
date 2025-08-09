import "./globals.css";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";

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
    "@type": "Comercio de Huevos",
    name: "El nuevo Manantial",
    url: "https://atleticotostado.vercel.app",
    logo: "https://atleticotostado.vercel.app/logo-cat.png",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Gobernador Crespo 1650",
      addressLocality: "Tostado",
      addressRegion: "Santa Fe",
      postalCode: "3060",
      addressCountry: "AR",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+54-3491-470123",
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
        {children}
      </body>
    </html>
  );
}
