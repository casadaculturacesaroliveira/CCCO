import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Casa da Cultura César Oliveira — Cultura que acontece",
  description: "Programação cultural, espetáculos e encontros na Casa da Cultura César Oliveira.",
  icons: { icon: [{ url: "/ccco-icon.svg", type: "image/svg+xml" }], apple: "/ccco-icon.svg" },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "CCCO", statusBarStyle: "black-translucent" },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-PT"><body>{children}</body></html>;
}