import i18next from "../i18n";

export function registerPasswordError(
  password: string,
  confirmPassword: string,
): string | null {
  if (password.length < 10) return i18next.t("validation.passwordTooShort");
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password))
    return i18next.t("validation.passwordWeak");
  if (password !== confirmPassword) return i18next.t("validation.passwordMismatch");
  return null;
}
