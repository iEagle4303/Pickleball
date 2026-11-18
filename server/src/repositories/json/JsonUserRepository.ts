import type {
  UserRepository,
  NewUser,
  UserProfile,
} from "../interfaces/UserRepository.js";
import type { JsonDatabase } from "./JsonDatabase.js";
import { nextID } from "./identity.js";
export class JsonUserRepository implements UserRepository {
  constructor(private readonly data: JsonDatabase) {}
  async list() {
    return [...this.data.users];
  }
  async count() {
    return this.data.users.length;
  }
  async findById(userID: number) {
    return this.data.users.find((user) => user.userID === userID) ?? null;
  }
  async findByUsername(username: string) {
    return (
      this.data.users.find(
        (user) => user.username.toLowerCase() === username.toLowerCase(),
      ) ?? null
    );
  }
  async findByEmail(email: string) {
    return (
      this.data.users.find(
        (user) => user.email.toLowerCase() === email.toLowerCase(),
      ) ?? null
    );
  }
  async findByLogin(identifier: string) {
    return (
      (await this.findByUsername(identifier)) ?? this.findByEmail(identifier)
    );
  }
  async create(input: NewUser) {
    const user = { ...input, userID: nextID(this.data.users, "userID") };
    this.data.users.push(user);
    return user;
  }
  async updateProfile(userID: number, input: UserProfile) {
    const user = await this.findById(userID);
    if (!user) throw new Error("Cannot update a missing user.");
    Object.assign(user, input);
    return user;
  }
}
