import { UnauthorizedError } from "../errors/app-error.js";
import {
  userRepository,
  type UserRepository,
} from "../repositories/user.repository.js";

export class UserService {
  constructor(private readonly users: UserRepository = userRepository) {}

  async getMe(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedError();
    return user;
  }
}

export const userService = new UserService();
