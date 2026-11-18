import type { Team, PublicUser } from "../../types/entities.js";
export type NewTeam = Omit<Team, "teamID">;
export type TeamChanges = Pick<Team, "name" | "color">;
export interface TeamQueries {
  list(): Promise<Team[]>;
  count(): Promise<number>;
  findById(teamID: number): Promise<Team | null>;
  findByName(name: string): Promise<Team | null>;
  listForTournament(tournamentID: number): Promise<Team[]>;
  listMembers(teamID: number): Promise<PublicUser[]>;
  hasMember(teamID: number, userID: number): Promise<boolean>;
}
export interface TeamRepository extends TeamQueries {
  create(input: NewTeam): Promise<Team>;
  update(teamID: number, input: TeamChanges): Promise<Team>;
  addMember(teamID: number, userID: number): Promise<void>;
  removeMember(teamID: number, userID: number): Promise<void>;
}
