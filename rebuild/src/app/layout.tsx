import type { Metadata } from "next";
import "./styles.css";
import "./components.css";
import { DemoProvider } from "@/features/demo/demo-store";

export const metadata: Metadata = {
  title: "Plano a Dois",
  description: "Financas compartilhadas para casais.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body><DemoProvider>{children}</DemoProvider></body>
    </html>
  );
}
