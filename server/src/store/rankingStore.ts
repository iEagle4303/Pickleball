import type { CompetitionData } from "./types.js";
import type { JsonStoreSession } from "./json/JsonStoreSession.js";
import { competitionData } from "./json/views.js";
/**
 * Data-access contract for RankingService, independent of JSON or SQL storage.
 */
export interface RankingStore {
  /**
   * Loads tournament, participating-team, result, and roster inputs from one consistent snapshot.
   *
   * @param tournamentID - Primary key of the tournament.
   * @returns Tournament, teams, completed results, and rosters used by ranking and matchup calculations. Returns null when no matching record exists.
   */
  getCompetition(tournamentID: number): Promise<CompetitionData | null>;
}
/**
 * JSON implementation of RankingStore; SQL implementations can provide the same public contract.
 */
export class JsonRankingStore implements RankingStore {
  /**
   * Creates the JSON-backed JsonRankingStore with its required dependencies.
   *
   * @param session - JSON scope to bind to this feature store.
   */
  constructor(private readonly session: JsonStoreSession) {}
  /**
   * Loads tournament, participating-team, result, and roster inputs from one consistent snapshot.
   *
   * @param tournamentID - Primary key of the tournament.
   * @returns Tournament, teams, completed results, and rosters used by ranking and matchup calculations. Returns null when no matching record exists.
   */
  getCompetition(tournamentID: number): Promise<CompetitionData | null> {
    return this.session.read((data) => competitionData(data, tournamentID));
  }
}
