import { hash, verify } from "@node-rs/argon2";

import { InvalidCredentialsError, UnauthorizedError } from "../errors/app-error.js";
import {
  sessionRepository,
  type SessionRepository,
} from "../repositories/session.repository.js";
import {
  userRepository,
  type PreferencesUpdate,
  type UserRepository,
} from "../repositories/user.repository.js";
import type { ChangePasswordInput } from "../schemas/preferences.schema.js";

export class UserService {
  constructor(
    private readonly users: UserRepository = userRepository,
    private readonly sessions: SessionRepository = sessionRepository,
  ) {}

  async getMe(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedError();
    return user;
  }

  async updatePreferences(userId: string, data: PreferencesUpdate) {
    return this.users.updatePreferences(userId, data);
  }

  async changePassword(userId: string, input: ChangePasswordInput) {
    const auth = await this.users.findAuthById(userId);
    if (!auth) throw new UnauthorizedError();

    const ok = await verify(auth.passwordHash, input.currentPassword);
    if (!ok) throw new InvalidCredentialsError();

    const passwordHash = await hash(input.newPassword);
    await this.users.updatePassword(userId, passwordHash);
  }

  async exportData(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedError();

    const sessions = await this.sessions.listAllForUser(userId);
    return { exportedAt: new Date().toISOString(), user, sessions };
  }

  async deleteAccount(userId: string, password: string) {
    const auth = await this.users.findAuthById(userId);
    if (!auth) throw new UnauthorizedError();

    const ok = await verify(auth.passwordHash, password);
    if (!ok) throw new InvalidCredentialsError();

    await this.users.deleteById(userId);
  }
}

export const userService = new UserService();
