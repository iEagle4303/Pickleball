import { randomBytes } from "node:crypto";
import type {
  UnitOfWork,
  WriteRepositories,
} from "../../repositories/interfaces/UnitOfWork.js";
import type { AuthUser, User } from "../../types/entities.js";
import { authUser } from "../mappers/userView.js";
import { ensure } from "../errors.js";
import { hashPassword, verifyPassword, hashToken } from "./passwords.js";
import { loginSchema, registerSchema } from "../validation.js";
export class AuthService {
  constructor(private readonly work: UnitOfWork) {}
  async register(input: unknown) {
    const { password, ...value } = registerSchema.parse(input);
    const passwordHash = await hashPassword(password);
    return this.work.transaction(async (repositories) => {
      const [byUsername, byEmail] = await Promise.all([
        repositories.users.findByUsername(value.username),
        repositories.users.findByEmail(value.email),
      ]);
      ensure(
        !byUsername && !byEmail,
        409,
        "That username or email is already registered.",
      );
      const user = await repositories.users.create({ ...value, passwordHash });
      return this.createSession(repositories, user);
    });
  }
  async login(input: unknown) {
    const value = loginSchema.parse(input);
    const user = await this.work.query((repositories) =>
      repositories.users.findByLogin(value.username),
    );
    // A fixed-cost dummy hash avoids skipping password work for unknown accounts.
    const valid = await verifyPassword(
      value.password,
      user?.passwordHash ||
        "scrypt:00000000000000000000000000000000:" + "00".repeat(64),
    );
    ensure(user && valid, 401, "Username or password is incorrect.");
    return this.work.transaction(async (repositories) => {
      const current = await repositories.users.findById(user.userID);
      ensure(
        current && current.passwordHash === user.passwordHash,
        401,
        "Username or password is incorrect.",
      );
      return this.createSession(repositories, current);
    });
  }
  private async createSession(repositories: WriteRepositories, user: User) {
    const token = randomBytes(32).toString("hex");
    await repositories.sessions.removeExpired(new Date().toISOString());
    await repositories.sessions.create({
      tokenHash: hashToken(token),
      userID: user.userID,
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    });
    return { token, user: await authUser(repositories.permissions, user) };
  }
  async currentUser(token?: string): Promise<AuthUser | null> {
    if (!token || token.length !== 64) return null;
    return this.work.query(async (repositories) => {
      const session = await repositories.sessions.findValid(
        hashToken(token),
        new Date().toISOString(),
      );
      if (!session) return null;
      const user = await repositories.users.findById(session.userID);
      return user ? authUser(repositories.permissions, user) : null;
    });
  }
  async logout(token?: string) {
    if (!token) return;
    await this.work.transaction(async (repositories) => {
      await repositories.sessions.remove(hashToken(token));
    });
  }
}
