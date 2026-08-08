import { describe, expect, it } from "vitest";
import { authMessage, safeNext } from "./auth-flow";

describe("invitation auth flow", () => {
  it("preserves only internal destinations", () => {
    expect(safeNext("/aceitar-convite?token=abc")).toBe("/aceitar-convite?token=abc");
    expect(safeNext("//evil.example")).toBeUndefined();
    expect(safeNext("https://evil.example")).toBeUndefined();
  });
  it("does not expose provider errors", () => {
    expect(authMessage("Auth session missing!", "signup")).toBe("Não foi possível criar a conta agora. Tente novamente.");
    expect(authMessage("Invalid login credentials")).toBe("E-mail ou senha incorretos.");
  });
});
