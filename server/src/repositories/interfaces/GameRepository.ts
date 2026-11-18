import type { Game } from "../../types/entities.js";
export interface GameFilters {
  tournamentID?: number;
  teamID?: number;
  limit?: number;
}
export type GameChanges = Omit<Game, "gameID">;
export interface TeamRecord {
  wins: number;
  losses: number;
}
export interface GameQueries {
  /** Order by playedAt descending, then gameID descending. Apply limit after filters. */
  list(filters?: GameFilters): Promise<Game[]>;
  count(filters?: Omit<GameFilters, "limit">): Promise<number>;
  findById(gameID: number): Promise<Game | null>;
  getTeamRecord(teamID: number, tournamentID?: number): Promise<TeamRecord>;
}
export interface GameRepository extends GameQueries {
  create(input: GameChanges): Promise<Game>;
  update(gameID: number, input: GameChanges): Promise<Game>;
  remove(gameID: number): Promise<void>;
}
