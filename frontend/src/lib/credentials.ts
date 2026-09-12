/**
 * Client-side registration validation. Mirrors the backend rules (min 10 chars,
 * at least one letter and one digit) and adds the password confirmation check,
 * so the user gets immediate feedback before the request is sent. Returns a
 * pt-BR message when something is wrong, or `null` when the input is valid.
 */
export function registerPasswordError(
  password: string,
  confirmPassword: string,
): string | null {
  if (password.length < 10)
    return "A senha precisa ter ao menos 10 caracteres.";
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password))
    return "A senha precisa ter pelo menos uma letra e um número.";
  if (password !== confirmPassword) return "As senhas não conferem.";
  return null;
}
