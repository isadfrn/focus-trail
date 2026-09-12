import { hash, verify } from "@node-rs/argon2";

import { InvalidCredentialsError, UnauthorizedError } from "../errors/app-error.js";
import {
  userRepository,
  type PreferencesUpdate,
  type UserRepository,
} from "../repositories/user.repository.js";
import type { ChangePasswordInput } from "../schemas/preferences.schema.js";

export class UserService {
  constructor(private readonly users: UserRepository = userRepository) {}

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
}

export const userService = new UserService();
