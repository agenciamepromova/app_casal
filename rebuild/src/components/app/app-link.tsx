"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";
import { demoHref } from "@/lib/demo-routing";
export default function AppLink(props: ComponentProps<typeof Link>) {
  const path = usePathname();
  return <Link {...props} href={typeof props.href === "string" ? demoHref(path, props.href) : props.href}/>;
}
