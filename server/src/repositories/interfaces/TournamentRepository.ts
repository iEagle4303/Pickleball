import type { Tournament } from "../../types/entities.js";
export type TournamentChanges = Omit<Tournament, "tournamentID">;
export interface TournamentQueries {
  list(): Promise<Tournament[]>;
  count(): Promise<number>;
  findById(tournamentID: number): Promise<Tournament | null>;
  listChildren(tournamentID: number): Promise<Tournament[]>;
  listForTeam(teamID: number): Promise<Tournament[]>;
  listTeamIDs(tournamentID: number): Promise<number[]>;
  countTeams(tournamentID: number): Promise<number>;
  hasTeam(tournamentID: number, teamID: number): Promise<boolean>;
}
export interface TournamentRepository extends TournamentQueries {
  create(input: TournamentChanges): Promise<Tournament>;
  update(tournamentID: number, input: TournamentChanges): Promise<Tournament>;
  remove(tournamentID: number): Promise<void>;
  replaceTeams(tournamentID: number, teamIDs: readonly number[]): Promise<void>;
}
