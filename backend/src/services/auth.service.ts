import { hash, verify } from "@node-rs/argon2";

import { env } from "../env.js";
import {
  ConflictError,
  EmailNotVerifiedError,
  InvalidCodeError,
  InvalidCredentialsError,
} from "../errors/app-error.js";
import { VERIFICATION_PURPOSES } from "../lib/verification-code.js";
import {
  authSessionRepository,
  type AuthSessionRepository,
} from "../repositories/auth-session.repository.js";
import {
  userRepository,
  type UserRepository,
} from "../repositories/user.repository.js";
import type { CredentialsInput } from "../schemas/auth.schema.js";
import {
  verificationService,
  type VerificationService,
} from "./verification.service.js";

export const DUMMY_PASSWORD_HASH =
  "$argon2id$v=19$m=19456,t=2,p=1$9iEmL5n+/FB4SEx+ScHNAQ$ytR0rlzKzxNRfrfhls2PBCyKnL/6vmJF8bFe+ttePBI";

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export class AuthService {
  constructor(
    private readonly users: UserRepository = userRepository,
    private readonly verification: VerificationService = verificationService,
    private readonly authSessions: AuthSessionRepository = authSessionRepository,
  ) {}

  async register(input: CredentialsInput) {
    const email = normalizeEmail(input.email);

    const existing = await this.users.findByEmail(email);
    if (existing) {
      await hash(input.password);
      throw new ConflictError();
    }

    const passwordHash = await hash(input.password);
    const verificationRequired = env.EMAIL_ENABLED;
    const user = await this.users.create({
      email,
      passwordHash,
      emailVerifiedAt: verificationRequired ? null : new Date(),
    });
    return { user, verificationRequired };
  }

  async login(input: CredentialsInput) {
    const email = normalizeEmail(input.email);

    const user = await this.users.findByEmail(email);
    if (!user) {
      await verify(DUMMY_PASSWORD_HASH, input.password);
      throw new InvalidCredentialsError();
    }

    const ok = await verify(user.passwordHash, input.password);
    if (!ok) throw new InvalidCredentialsError();

    if (env.EMAIL_ENABLED && !user.emailVerifiedAt) {
      throw new EmailNotVerifiedError();
    }

    return {
      id: user.id,
      email: user.email,
      character: user.character,
      focusMinutes: user.focusMinutes,
      breakMinutes: user.breakMinutes,
    };
  }

  async sendEmailVerification(user: { id: string; email: string }) {
    await this.verification.issue(user, VERIFICATION_PURPOSES.emailVerification);
  }

  async verifyEmail(rawEmail: string, code: string) {
    const email = normalizeEmail(rawEmail);
    const user = await this.users.findByEmail(email);
    if (!user) throw new InvalidCodeError();

    const ok = await this.verification.check(
      user.id,
      VERIFICATION_PURPOSES.emailVerification,
      code,
    );
    if (!ok) throw new InvalidCodeError();

    return this.users.markEmailVerified(user.id);
  }

  async resendEmailVerification(rawEmail: string) {
    const user = await this.users.findByEmail(normalizeEmail(rawEmail));
    // No account enumeration: act only on an existing, still-unverified account.
    if (user && !user.emailVerifiedAt) {
      await this.verification.issue(
        { id: user.id, email: user.email },
        VERIFICATION_PURPOSES.emailVerification,
      );
    }
  }

  async requestPasswordReset(rawEmail: string) {
    const user = await this.users.findByEmail(normalizeEmail(rawEmail));
    // Always returns void — the caller responds the same whether or not the
    // account exists, to avoid revealing which emails are registered.
    if (user) {
      await this.verification.issue(
        { id: user.id, email: user.email },
        VERIFICATION_PURPOSES.passwordReset,
      );
    }
  }

  async resetPassword(rawEmail: string, code: string, newPassword: string) {
    const user = await this.users.findByEmail(normalizeEmail(rawEmail));
    if (!user) throw new InvalidCodeError();

    const ok = await this.verification.check(
      user.id,
      VERIFICATION_PURPOSES.passwordReset,
      code,
    );
    if (!ok) throw new InvalidCodeError();

    const passwordHash = await hash(newPassword);
    await this.users.updatePassword(user.id, passwordHash);
    // Force re-login everywhere after a password reset.
    await this.authSessions.revokeAllForUser(user.id);
  }
}

export const authService = new AuthService();
