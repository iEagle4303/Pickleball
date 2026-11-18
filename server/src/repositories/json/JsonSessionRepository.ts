import type { SessionRepository } from "../interfaces/SessionRepository.js";
import type { Session } from "../../types/entities.js";
import type { JsonDatabase } from "./JsonDatabase.js";
export class JsonSessionRepository implements SessionRepository {
  constructor(private readonly data: JsonDatabase) {}
  async findValid(tokenHash: string, now: string) {
    return (
      this.data.sessions.find(
        (session) =>
          session.tokenHash === tokenHash &&
          new Date(session.expiresAt).getTime() > new Date(now).getTime(),
      ) ?? null
    );
  }
  async create(session: Session) {
    this.data.sessions.push(session);
  }
  async remove(tokenHash: string) {
    this.data.sessions = this.data.sessions.filter(
      (session) => session.tokenHash !== tokenHash,
    );
  }
  async removeExpired(now: string) {
    this.data.sessions = this.data.sessions.filter(
      (session) =>
        new Date(session.expiresAt).getTime() > new Date(now).getTime(),
    );
  }
}
