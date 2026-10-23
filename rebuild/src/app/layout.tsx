import type { Metadata } from "next";
import "./styles.css";
import "./components.css";
import "./themes.css";
import "./mobile-simple.css";
import { Suspense } from "react";
import { AppProviders } from "@/components/app/app-providers";

export const metadata: Metadata = {
  title: "Plano a Dois",
  description: "Finanças compartilhadas para casais.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: `(function(){try{var raw=localStorage.getItem(location.pathname==="/demo"||location.pathname.startsWith("/demo/")?"plano-a-dois-public-demo-v1":"plano-a-dois-rebuild-v3");var saved=raw?JSON.parse(raw).user?.theme:null;var preference=saved||"system";var theme=preference==="system"?(matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"):preference;document.documentElement.dataset.theme=theme;document.documentElement.dataset.themePreference=preference}catch(_){document.documentElement.dataset.theme=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}})()` }} /></head>
      <body><Suspense fallback={<main className="page-loading">Preparando o espaço de vocês...</main>}><AppProviders>{children}</AppProviders></Suspense></body>
    </html>
  );
}
