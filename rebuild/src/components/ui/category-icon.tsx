import type { CSSProperties } from "react";
import { BriefcaseBusiness, CarFront, CircleDollarSign, HeartPulse, Home, Landmark, PawPrint, Plane, ReceiptText, ShoppingBag, Sparkles, TrendingUp, Utensils, Wrench } from "lucide-react";

type CategoryIconProps = { name?: string; type?: "income" | "expense"; color?: string; className?: string };
const normalize = (value = "") => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function CategoryIcon({ name, type = "expense", color = "#d8ab43", className = "" }: CategoryIconProps) {
  const value = normalize(name);
  const Icon = value.includes("aliment") ? Utensils
    : value.includes("casa") || value.includes("moradia") ? Home
    : value.includes("transport") || value.includes("carro") ? CarFront
    : value.includes("saude") ? HeartPulse
    : value.includes("ferrament") || value.includes("manut") ? Wrench
    : value.includes("imposto") || value.includes("taxa") ? Landmark
    : value.includes("pet") ? PawPrint
    : value.includes("viag") ? Plane
    : value.includes("compra") ? ShoppingBag
    : value.includes("salario") || value.includes("receita") ? CircleDollarSign
    : value.includes("projeto") || value.includes("freela") || value.includes("trabalho") ? BriefcaseBusiness
    : value.includes("outro") ? Sparkles
    : type === "income" ? TrendingUp
    : ReceiptText;
  return <span className={`category-glyph ${className}`.trim()} style={{ "--category-color": color } as CSSProperties} aria-hidden="true"><Icon /></span>;
}
