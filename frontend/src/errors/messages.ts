const AUTH_ERRORS: Record<string, string> = {
  email_taken: "Esse e-mail ja esta cadastrado.",
  invalid_credentials: "E-mail ou senha incorretos.",
  invalid_body:
    "Preencha um e-mail valido e uma senha de pelo menos 8 caracteres.",
};

/** Maps an auth error code from the API to a user-facing pt-BR message. */
export function authErrorMessage(code: string): string {
  return AUTH_ERRORS[code] ?? "Algo deu errado. Tente de novo.";
}
