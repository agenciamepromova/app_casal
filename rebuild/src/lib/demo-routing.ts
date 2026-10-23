const screens = new Set(["dashboard","movimentacoes","agenda","mais","contas","categorias","projetos","metas","nosso-espaco","configuracoes","cartao-demo","acai-demo"]);
export function isPublicDemoPath(path: string) { return path === "/demo" || path.startsWith("/demo/"); }
export function demoHref(path: string, href: string) {
  if (!isPublicDemoPath(path) || !href.startsWith("/")) return href;
  const screen = href.slice(1).split(/[/?#]/)[0];
  return screens.has(screen) ? "/demo" + href : href;
}
