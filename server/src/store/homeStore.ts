import type { HomeData } from "../types/entities.js";
import type { CompetitionData } from "./types.js";
import type { JsonStoreSession } from "./json/JsonStoreSession.js";
import {
  tournamentView,
  gameView,
  competitionData,
  listGames,
} from "./json/views.js";
/**
 * Clubhouse data plus internal competition inputs; services remove internal inputs from API responses.
 */
export interface HomeSnapshot extends Omit<HomeData, "rankings" | "matchups"> {
  /** Internal consistent inputs for ranking and matchup calculation; omitted from the public home response. */
  competition: CompetitionData | null;
}
/**
 * Data-access contract for HomeService, independent of JSON or SQL storage.
 */
export interface HomeStore {
  /**
   * Loads a consistent clubhouse snapshot and internal competition inputs without calculating rankings.
   *
   * @returns Consistent stored clubhouse summaries and internal inputs for service calculations.
   */
  get(): Promise<HomeSnapshot>;
}
/**
 * JSON implementation of HomeStore; SQL implementations can provide the same public contract.
 */
export class JsonHomeStore implements HomeStore {
  /**
   * Creates the JSON-backed JsonHomeStore with its required dependencies.
   *
   * @param session - JSON scope to bind to this feature store.
   */
  constructor(private readonly session: JsonStoreSession) {}
  /**
   * Loads a consistent clubhouse snapshot and internal competition inputs without calculating rankings.
   *
   * @returns Consistent stored clubhouse summaries and internal inputs for service calculations.
   */
  get(): Promise<HomeSnapshot> {
    return this.session.read((data) => {
      const active = data.tournaments.find(
        (tournament) =>
          tournament.status === "active" &&
          tournament.parentTournamentID === null,
      );
      return {
        active: active ? tournamentView(data, active) : null,
        tournaments: data.tournaments.map((tournament) =>
          tournamentView(data, tournament),
        ),
        recentGames: listGames(data, undefined, undefined, 5).map((game) =>
          gameView(data, game),
        ),
        stats: {
          members: data.users.length,
          teams: data.teams.length,
          games: data.games.length,
          tournaments: data.tournaments.length,
        },
        competition: active ? competitionData(data, active.tournamentID) : null,
      };
    });
  }
}
