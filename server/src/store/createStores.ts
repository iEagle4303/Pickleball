import { JsonAuthStore, type AuthStore } from "./authStore.js";
import { JsonHomeStore, type HomeStore } from "./homeStore.js";
import {
  JsonTournamentStore,
  type TournamentStore,
} from "./tournamentStore.js";
import { JsonTeamStore, type TeamStore } from "./teamStore.js";
import { JsonGameStore, type GameStore } from "./gameStore.js";
import { JsonUserStore, type UserStore } from "./userStore.js";
import {
  JsonPermissionStore,
  type PermissionStore,
} from "./permissionStore.js";
import { JsonRankingStore, type RankingStore } from "./rankingStore.js";
import { JsonMatchupStore, type MatchupStore } from "./matchupStore.js";
import type { JsonFileStore } from "./json/JsonFileStore.js";
import { JsonStoreSession } from "./json/JsonStoreSession.js";
/**
 * Per-service data-access dependencies; JSON and future SQL factories provide the same contracts.
 */
export interface Stores {
  /** Account and session dependency. */
  auth: AuthStore;
  /** Clubhouse aggregation dependency. */
  home: HomeStore;
  /** Tournament and participation dependency. */
  tournaments: TournamentStore;
  /** Team and roster dependency. */
  teams: TeamStore;
  /** Game-result and history dependency. */
  games: GameStore;
  /** Member profile and permission-assignment dependency. */
  users: UserStore;
  /** Permission-catalog dependency. */
  permissions: PermissionStore;
  /** Leaderboard input or calculation dependency. */
  rankings: RankingStore;
  /** Matchup input or generation dependency. */
  matchups: MatchupStore;
}
/**
 * Creates all JSON-backed feature stores over the same atomic file store.
 *
 * @param file - Atomic JSON file store shared by the feature stores.
 * @returns The nine per-service JSON stores sharing the same atomic file store.
 */
export function createJsonStores(file: JsonFileStore): Stores {
  const session = new JsonStoreSession(file);
  return {
    auth: new JsonAuthStore(session),
    home: new JsonHomeStore(session),
    tournaments: new JsonTournamentStore(session),
    teams: new JsonTeamStore(session),
    games: new JsonGameStore(session),
    users: new JsonUserStore(session),
    permissions: new JsonPermissionStore(session),
    rankings: new JsonRankingStore(session),
    matchups: new JsonMatchupStore(session),
  };
}
