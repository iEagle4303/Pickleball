import type {
  TournamentRepository,
  TournamentChanges,
} from "../interfaces/TournamentRepository.js";
import type { JsonDatabase } from "./JsonDatabase.js";
import { nextID } from "./identity.js";
export class JsonTournamentRepository implements TournamentRepository {
  constructor(private readonly data: JsonDatabase) {}
  async list() {
    return [...this.data.tournaments];
  }
  async count() {
    return this.data.tournaments.length;
  }
  async findById(tournamentID: number) {
    return (
      this.data.tournaments.find((row) => row.tournamentID === tournamentID) ??
      null
    );
  }
  async listChildren(tournamentID: number) {
    return this.data.tournaments.filter(
      (row) => row.parentTournamentID === tournamentID,
    );
  }
  async listForTeam(teamID: number) {
    const ids = new Set(
      this.data.teamTournaments
        .filter((link) => link.teamID === teamID)
        .map((link) => link.tournamentID),
    );
    return this.data.tournaments.filter((row) => ids.has(row.tournamentID));
  }
  async listTeamIDs(tournamentID: number) {
    return this.data.teamTournaments
      .filter((link) => link.tournamentID === tournamentID)
      .map((link) => link.teamID);
  }
  async countTeams(tournamentID: number) {
    return this.data.teamTournaments.filter(
      (link) => link.tournamentID === tournamentID,
    ).length;
  }
  async hasTeam(tournamentID: number, teamID: number) {
    return this.data.teamTournaments.some(
      (link) => link.tournamentID === tournamentID && link.teamID === teamID,
    );
  }
  async create(input: TournamentChanges) {
    const tournament = {
      ...input,
      tournamentID: nextID(this.data.tournaments, "tournamentID"),
    };
    this.data.tournaments.push(tournament);
    return tournament;
  }
  async update(tournamentID: number, input: TournamentChanges) {
    const tournament = await this.findById(tournamentID);
    if (!tournament) throw new Error("Cannot update a missing tournament.");
    Object.assign(tournament, input);
    return tournament;
  }
  async remove(tournamentID: number) {
    this.data.tournaments = this.data.tournaments.filter(
      (row) => row.tournamentID !== tournamentID,
    );
    this.data.teamTournaments = this.data.teamTournaments.filter(
      (link) => link.tournamentID !== tournamentID,
    );
  }
  async replaceTeams(tournamentID: number, teamIDs: readonly number[]) {
    this.data.teamTournaments = this.data.teamTournaments.filter(
      (link) => link.tournamentID !== tournamentID,
    );
    this.data.teamTournaments.push(
      ...teamIDs.map((teamID) => ({ teamID, tournamentID })),
    );
  }
}
