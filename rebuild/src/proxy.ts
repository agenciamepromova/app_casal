import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  // Explicit fixture-only route: no Supabase client, cookies or remote auth calls.
  if(request.nextUrl.pathname==="/demo"||request.nextUrl.pathname.startsWith("/demo/"))return NextResponse.next({request});
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) return NextResponse.next({ request });
  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items) => {
        items.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        items.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  const publicPaths = ["/login", "/cadastro", "/recuperar-senha", "/atualizar-senha", "/aceitar-convite", "/auth/callback"];
  const isPublic = publicPaths.includes(request.nextUrl.pathname);
  const isPrivate = !isPublic && request.nextUrl.pathname !== "/";
  if (!user && isPrivate) {
    const destination = request.nextUrl.clone(); destination.pathname = "/login"; destination.search = "";
    const redirect = NextResponse.redirect(destination);
    response.cookies.getAll().forEach(cookie => redirect.cookies.set(cookie));
    return redirect;
  }
  if (user && isPublic && !["/aceitar-convite","/auth/callback","/atualizar-senha"].includes(request.nextUrl.pathname)) {
    const destination = request.nextUrl.clone(); destination.pathname = "/dashboard"; destination.search = "";
    const redirect = NextResponse.redirect(destination);
    response.cookies.getAll().forEach(cookie => redirect.cookies.set(cookie));
    return redirect;
  }
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
