import { sendEmail } from "../lib/email.js";
import {
  CODE_TTL_MS,
  generateCode,
  hashCode,
  verifyCode,
  VERIFICATION_PURPOSES,
  type VerificationPurpose,
} from "../lib/verification-code.js";
import {
  verificationCodeRepository,
  type VerificationCodeRepository,
} from "../repositories/verification-code.repository.js";

function emailFor(purpose: VerificationPurpose, code: string) {
  if (purpose === VERIFICATION_PURPOSES.emailVerification) {
    return {
      subject: "Confirme seu cadastro no Focus Trail",
      text: `Seu código de confirmação do Focus Trail é ${code}. Ele expira em 15 minutos.`,
      html: `<p>Seu código de confirmação do Focus Trail é <strong style="font-size:20px;letter-spacing:2px">${code}</strong>.</p><p>Ele expira em 15 minutos. Se você não criou uma conta, ignore este e-mail.</p>`,
    };
  }
  return {
    subject: "Recuperação de senha do Focus Trail",
    text: `Seu código para redefinir a senha do Focus Trail é ${code}. Ele expira em 15 minutos.`,
    html: `<p>Seu código para redefinir a senha do Focus Trail é <strong style="font-size:20px;letter-spacing:2px">${code}</strong>.</p><p>Ele expira em 15 minutos. Se você não pediu isso, ignore este e-mail.</p>`,
  };
}

export class VerificationService {
  constructor(
    private readonly codes: VerificationCodeRepository = verificationCodeRepository,
  ) {}

  /** Generates a fresh code, stores its hash, and emails the plaintext code. */
  async issue(
    user: { id: string; email: string },
    purpose: VerificationPurpose,
  ): Promise<void> {
    const code = generateCode();
    await this.codes.replaceForUserPurpose({
      userId: user.id,
      purpose,
      codeHash: hashCode(code),
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
    });
    await sendEmail({ to: user.email, ...emailFor(purpose, code) });
  }

  /** Returns true and consumes the code when it matches an active one. */
  async check(
    userId: string,
    purpose: VerificationPurpose,
    code: string,
  ): Promise<boolean> {
    const active = await this.codes.findActive(userId, purpose);
    if (!active || !verifyCode(code, active.codeHash)) return false;
    await this.codes.consume(active.id);
    return true;
  }
}

export const verificationService = new VerificationService();
