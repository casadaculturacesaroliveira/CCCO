import type { Metadata } from "next";
import "./globals.css";

const siteUrl = "https://ccco.pt";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Casa da Cultura César Oliveira | Oliveira do Hospital",
    template: "%s | Casa da Cultura César Oliveira",
  },
  description:
    "Conheça a programação da Casa da Cultura César Oliveira, em Oliveira do Hospital: concertos, teatro, cinema e outros eventos culturais.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_PT",
    url: siteUrl,
    siteName: "Casa da Cultura César Oliveira",
    title: "Casa da Cultura César Oliveira | Oliveira do Hospital",
    description:
      "Descubra a programação cultural da Casa da Cultura César Oliveira em Oliveira do Hospital.",
  },
  robots: { index: true, follow: true },
  icons: { icon: [{ url: "/ccco-icon.svg", type: "image/svg+xml" }], apple: "/apple-touch-icon.png" },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "CCCO", statusBarStyle: "black-translucent" },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Casa da Cultura César Oliveira",
  url: siteUrl,
  location: {
    "@type": "Place",
    name: "Oliveira do Hospital",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Oliveira do Hospital",
      addressCountry: "PT",
    },
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-PT">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema).replace(/</g, "\\u003c") }}
        />
        {children}
      </body>
    </html>
  );
}
