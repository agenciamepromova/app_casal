import { describe, expect, it } from "vitest";
import { formatCents, parseMoneyToCents } from "./money";

describe("money", () => {
  it("parses Brazilian values exactly", () => expect(parseMoneyToCents("1.234,56")).toBe(123456n));
  it("rejects more than two decimals", () => expect(() => parseMoneyToCents("1,999")).toThrow());
  it("formats cents", () => expect(formatCents(123456n)).toContain("1.234,56"));
});
