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
