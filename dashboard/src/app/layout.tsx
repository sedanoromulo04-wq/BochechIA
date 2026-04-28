import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BochechIA Dashboard",
  description: "Painel operacional do BochechIA para squads, clientes e roteamento.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
