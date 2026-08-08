export type SignupOutcome = "authenticated" | "confirmation_required" | "existing_account";

export function safeNext(value?: string) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : undefined;
}

export function authMessage(message: string, action: "login" | "signup" | "recover" = "login") {
  const normalized = message.toLowerCase();
  if (normalized.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (normalized.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (normalized.includes("already")) return "Este e-mail já possui uma conta. Entre com sua senha para aceitar o convite.";
  if (normalized.includes("password")) return "Use uma senha com pelo menos 6 caracteres.";
  if (normalized.includes("rate limit")) return "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.";
  return action === "recover" ? "Não foi possível enviar o link agora. Tente novamente." : action === "signup" ? "Não foi possível criar a conta agora. Tente novamente." : "Não foi possível entrar. Confira seus dados e tente novamente.";
}
