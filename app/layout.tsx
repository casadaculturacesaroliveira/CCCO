import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Casa da Cultura César Oliveira — Cultura que acontece",
  description: "Programação cultural, espetáculos e encontros na Casa da Cultura César Oliveira.",
  icons: { icon: "/logo.png" },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-PT"><body>{children}</body></html>;
}