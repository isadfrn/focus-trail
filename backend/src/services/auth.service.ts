import { hash, verify } from "@node-rs/argon2";

import { ConflictError, InvalidCredentialsError } from "../errors/app-error.js";
import {
  userRepository,
  type UserRepository,
} from "../repositories/user.repository.js";
import type { CredentialsInput } from "../schemas/auth.schema.js";

export const DUMMY_PASSWORD_HASH =
  "$argon2id$v=19$m=19456,t=2,p=1$9iEmL5n+/FB4SEx+ScHNAQ$ytR0rlzKzxNRfrfhls2PBCyKnL/6vmJF8bFe+ttePBI";

export class AuthService {
  constructor(private readonly users: UserRepository = userRepository) {}

  async register(input: CredentialsInput) {
    const email = input.email.toLowerCase().trim();

    const existing = await this.users.findByEmail(email);
    if (existing) {
      await hash(input.password);
      throw new ConflictError();
    }

    const passwordHash = await hash(input.password);
    return this.users.create({ email, passwordHash });
  }

  async login(input: CredentialsInput) {
    const email = input.email.toLowerCase().trim();

    const user = await this.users.findByEmail(email);
    if (!user) {
      await verify(DUMMY_PASSWORD_HASH, input.password);
      throw new InvalidCredentialsError();
    }

    const ok = await verify(user.passwordHash, input.password);
    if (!ok) throw new InvalidCredentialsError();

    return {
      id: user.id,
      email: user.email,
      character: user.character,
      focusMinutes: user.focusMinutes,
      breakMinutes: user.breakMinutes,
    };
  }
}

export const authService = new AuthService();
