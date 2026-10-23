import {it,expect} from "vitest";
import {demoHref,isPublicDemoPath} from "./demo-routing";
it("mantém navegação da demo isolada sem alterar login e links externos",()=>{expect(demoHref("/demo/agenda","/movimentacoes?nova=1")).toBe("/demo/movimentacoes?nova=1");expect(demoHref("/agenda","/movimentacoes")).toBe("/movimentacoes");expect(demoHref("/demo","/login")).toBe("/login");expect(demoHref("/demo","https://example.com")).toBe("https://example.com");expect(demoHref("/demo","/demo/agenda")).toBe("/demo/agenda");expect(isPublicDemoPath("/demonstracao")).toBe(false)});
