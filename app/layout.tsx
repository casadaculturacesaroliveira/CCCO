import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";
export const metadata: Metadata = {
  title: "Casa da Cultura César Oliveira — Cultura que acontece",
  description: "Programação cultural, espetáculos e encontros na Casa da Cultura César Oliveira.",
  icons: { icon: [{ url: "/ccco-icon.svg", type: "image/svg+xml" }], apple: "/apple-touch-icon.png" },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "CCCO", statusBarStyle: "black-translucent" },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-PT">
      <body>
        {children}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-FZYB96P3BE"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag("js", new Date());
gtag("config", "G-FZYB96P3BE");`}
        </Script>
      </body>
    </html>
  );
}