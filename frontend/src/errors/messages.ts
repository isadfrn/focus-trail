import i18next from "../i18n";

const AUTH_ERROR_KEYS = {
  CONFLICT: "errors.emailTaken",
  INVALID_CREDENTIALS: "errors.invalidCredentials",
  VALIDATION_ERROR: "errors.invalidBody",
  TOO_MANY_REQUESTS: "errors.tooManyRequests",
} as const;

type AuthErrorCode = keyof typeof AUTH_ERROR_KEYS;

function isAuthErrorCode(code: string): code is AuthErrorCode {
  return Object.hasOwn(AUTH_ERROR_KEYS, code);
}

export function authErrorMessage(code: string): string {
  return i18next.t(
    isAuthErrorCode(code) ? AUTH_ERROR_KEYS[code] : "errors.generic",
  );
}
