import { it,expect } from "vitest";
import { demoWeekResult,recipeEstimate } from "./acai-demo";
it("mantém simulação canônica isolada, sem descontar consumo e compra duas vezes",()=>{const result=demoWeekResult();expect(result.quantity).toBe(217);expect(result.revenue).toBe(2500);expect(recipeEstimate()).toBeCloseTo(3.53527,5);expect(result.consumption).toBeCloseTo(767.15,2);expect(result.purchases).toBeCloseTo(778.96,2);expect(result.cashChange).toBeCloseTo(1459.04,2);expect(result.partialMargin).toBeCloseTo(1470.85,2);expect(result.inventoryDifference).toBeCloseTo(11.81,2)});
