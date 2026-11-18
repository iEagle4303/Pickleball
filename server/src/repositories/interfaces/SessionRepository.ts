import type { Session } from "../../types/entities.js";
export interface SessionQueries {
  findValid(tokenHash: string, now: string): Promise<Session | null>;
}
export interface SessionRepository extends SessionQueries {
  create(session: Session): Promise<void>;
  remove(tokenHash: string): Promise<void>;
  removeExpired(now: string): Promise<void>;
}
