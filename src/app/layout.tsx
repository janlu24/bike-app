import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Setup Registry",
  description: "Dein digitaler Zwilling für Bikes, Komponenten und Equipment.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="dark">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
