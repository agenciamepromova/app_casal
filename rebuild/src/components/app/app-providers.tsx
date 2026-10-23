"use client";
import { usePathname } from "next/navigation";
import { DemoProvider } from "@/features/demo/demo-store";
import { isPublicDemoPath } from "@/lib/demo-routing";
export function AppProviders({children}:{children:React.ReactNode}) {
  const demoOnly = isPublicDemoPath(usePathname());
  return <DemoProvider key={demoOnly?"public-demo":"existing-login"} demoOnly={demoOnly}>{children}</DemoProvider>;
}
