import type { Metadata } from "next";
import "./styles.css";
import "./components.css";
import "./themes.css";
import "./mobile-simple.css";
import { DemoProvider } from "@/features/demo/demo-store";

export const metadata: Metadata = {
  title: "Plano a Dois",
  description: "Finanças compartilhadas para casais.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: `(function(){try{var raw=localStorage.getItem("plano-a-dois-rebuild-v3");var saved=raw?JSON.parse(raw).user?.theme:null;var preference=saved||"system";var theme=preference==="system"?(matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"):preference;document.documentElement.dataset.theme=theme;document.documentElement.dataset.themePreference=preference}catch(_){document.documentElement.dataset.theme=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}})()` }} /></head>
      <body><DemoProvider>{children}</DemoProvider></body>
    </html>
  );
}
