// Mensagens em português para os erros do Supabase Auth (que vêm em inglês, com `code` estável).
const BY_CODE: Record<string, string> = {
  invalid_credentials: "E-mail ou senha incorretos.",
  email_not_confirmed: "Confirme seu e-mail antes de entrar. Procure o link que enviamos (veja também o spam).",
  user_already_exists: "Já existe uma conta com este e-mail. Entre ou recupere a senha.",
  email_exists: "Já existe uma conta com este e-mail. Entre ou recupere a senha.",
  weak_password: "Senha fraca. Use pelo menos 8 caracteres, misturando letras e números.",
  same_password: "A nova senha precisa ser diferente da atual.",
  over_email_send_rate_limit: "Muitos e-mails enviados em pouco tempo. Aguarde alguns minutos e tente de novo.",
  over_request_rate_limit: "Muitas tentativas em pouco tempo. Aguarde um pouco e tente de novo.",
  email_address_invalid: "E-mail inválido.",
  signup_disabled: "Novos cadastros estão temporariamente desativados.",
  otp_expired: "O link expirou. Peça um novo.",
  flow_state_not_found: "O link expirou ou já foi usado. Peça um novo.",
  flow_state_expired: "O link expirou. Peça um novo.",
  session_not_found: "Sua sessão expirou. Entre novamente.",
  refresh_token_not_found: "Sua sessão expirou. Entre novamente.",
};

const NETWORK_HINT = "Sem conexão com o servidor. Verifique a internet e tente de novo.";

export function authErrorMessage(error: unknown): string {
  if (!error) return "Ocorreu um erro inesperado.";
  const e = error as { code?: string; name?: string; message?: string; status?: number };

  if (e.code && BY_CODE[e.code]) return BY_CODE[e.code];
  if (e.name === "AuthRetryableFetchError" || e.name === "TypeError" || /fetch|network/i.test(e.message ?? "")) {
    return NETWORK_HINT;
  }
  // Erros sem `code` em versões antigas do servidor: reconhece pelo texto.
  const message = e.message ?? "";
  if (/invalid login credentials/i.test(message)) return BY_CODE.invalid_credentials;
  if (/email not confirmed/i.test(message)) return BY_CODE.email_not_confirmed;
  if (/already registered/i.test(message)) return BY_CODE.user_already_exists;
  if (/password should be/i.test(message)) return BY_CODE.weak_password;
  if (/rate limit/i.test(message)) return BY_CODE.over_request_rate_limit;
  if (e.status === 429) return BY_CODE.over_request_rate_limit;

  // Mensagens que o próprio app gera já estão em português.
  return message || "Ocorreu um erro inesperado.";
}

export const MIN_PASSWORD_LENGTH = 8;

export function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return `A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return "Use letras e números na senha.";
  return null;
}

export function validateEmail(email: string): string | null {
  const value = email.trim();
  if (!value) return "Informe seu e-mail.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) return "E-mail inválido.";
  return null;
}

export function validateName(name: string): string | null {
  const value = name.trim();
  if (value.length < 2) return "Informe seu nome.";
  return null;
}
