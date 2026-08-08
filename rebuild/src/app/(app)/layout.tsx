import { Suspense } from "react";
import { AppShell } from "@/components/app/app-shell";
export default function Layout({ children }: { children: React.ReactNode }) { return <AppShell><Suspense fallback={<div className="page-loading">Preparando o espaço de vocês...</div>}>{children}</Suspense></AppShell>; }
