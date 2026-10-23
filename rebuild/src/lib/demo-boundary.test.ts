import {afterEach,describe,expect,it,vi} from "vitest";
import {NextRequest} from "next/server";
const createServerClient=vi.hoisted(()=>vi.fn(()=>({auth:{getUser:vi.fn(async()=>({data:{user:null}}))}})));
vi.mock("@supabase/ssr",()=>({createServerClient}));
import {proxy} from "../proxy";
afterEach(()=>{vi.unstubAllEnvs();vi.clearAllMocks()});
describe("fronteira pública da demonstração",()=>{
  it("serve somente /demo sem instanciar cliente ou chamar autenticação remota",async()=>{vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL","https://unused-demo.invalid");vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY","public-test-fixture");const response=await proxy(new NextRequest("https://preview.invalid/demo/agenda"));expect(response.status).toBe(200);expect(createServerClient).not.toHaveBeenCalled()});
  it("preserva proteção do dashboard e não aceita um prefixo parecido",async()=>{vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL","https://unused-demo.invalid");vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY","public-test-fixture");for(const path of ["/dashboard","/demonstracao"]){const response=await proxy(new NextRequest("https://preview.invalid"+path));expect(response.status).toBe(307);expect(response.headers.get("location")).toBe("https://preview.invalid/login")}expect(createServerClient).toHaveBeenCalledTimes(2)});
});
