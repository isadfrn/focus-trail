import { describe, expect, it } from "vitest";

import i18n from "../i18n";
import { authErrorMessage } from "./messages";

describe("authErrorMessage", () => {
  it("maps backend error codes to translated messages", () => {
    expect(authErrorMessage("INVALID_CREDENTIALS")).toBe(
      "E-mail ou senha incorretos.",
    );
    expect(authErrorMessage("CONFLICT")).toBe(
      "Esse e-mail já está cadastrado.",
    );
    expect(authErrorMessage("VALIDATION_ERROR")).toBe(
      "Preencha um e-mail válido e uma senha de pelo menos 10 caracteres.",
    );
    expect(authErrorMessage("TOO_MANY_REQUESTS")).toBe(
      "Muitas tentativas. Aguarde um instante e tente de novo.",
    );
  });

  it("follows the active language", async () => {
    await i18n.changeLanguage("en");
    expect(authErrorMessage("INVALID_CREDENTIALS")).toBe(
      "Incorrect email or password.",
    );

    await i18n.changeLanguage("es");
    expect(authErrorMessage("INVALID_CREDENTIALS")).toBe(
      "Correo electrónico o contraseña incorrectos.",
    );
  });

  it("returns the generic message for unknown codes", () => {
    expect(authErrorMessage("SOMETHING_NEW")).toBe(
      "Algo deu errado. Tente de novo.",
    );
    expect(authErrorMessage("http_500")).toBe(
      "Algo deu errado. Tente de novo.",
    );
    expect(authErrorMessage("constructor")).toBe(
      "Algo deu errado. Tente de novo.",
    );
  });
});
