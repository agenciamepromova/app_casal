import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Plano a Dois",
  description: "Financas compartilhadas para casais.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
