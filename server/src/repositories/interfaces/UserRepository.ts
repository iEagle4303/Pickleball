import type { User } from "../../types/entities.js";
export type NewUser = Omit<User, "userID">;
export type UserProfile = Pick<User, "displayName" | "email">;
export interface UserQueries {
  list(): Promise<User[]>;
  count(): Promise<number>;
  findById(userID: number): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByLogin(identifier: string): Promise<User | null>;
}
export interface UserRepository extends UserQueries {
  create(input: NewUser): Promise<User>;
  updateProfile(userID: number, input: UserProfile): Promise<User>;
}
