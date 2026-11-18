import type {
  TeamRepository,
  NewTeam,
  TeamChanges,
} from "../interfaces/TeamRepository.js";
import type { JsonDatabase } from "./JsonDatabase.js";
import { nextID } from "./identity.js";
export class JsonTeamRepository implements TeamRepository {
  constructor(private readonly data: JsonDatabase) {}
  async list() {
    return [...this.data.teams];
  }
  async count() {
    return this.data.teams.length;
  }
  async findById(teamID: number) {
    return this.data.teams.find((team) => team.teamID === teamID) ?? null;
  }
  async findByName(name: string) {
    return (
      this.data.teams.find(
        (team) => team.name.toLowerCase() === name.toLowerCase(),
      ) ?? null
    );
  }
  async listForTournament(tournamentID: number) {
    const ids = new Set(
      this.data.teamTournaments
        .filter((link) => link.tournamentID === tournamentID)
        .map((link) => link.teamID),
    );
    return this.data.teams.filter((team) => ids.has(team.teamID));
  }
  async listMembers(teamID: number) {
    return this.data.userTeams
      .filter((link) => link.teamID === teamID)
      .map((link) => {
        const user = this.data.users.find(
          (user) => user.userID === link.userID,
        );
        if (!user)
          throw new Error("Team membership references a missing user.");
        return {
          userID: user.userID,
          username: user.username,
          displayName: user.displayName,
        };
      });
  }
  async hasMember(teamID: number, userID: number) {
    return this.data.userTeams.some(
      (link) => link.teamID === teamID && link.userID === userID,
    );
  }
  async create(input: NewTeam) {
    const team = { ...input, teamID: nextID(this.data.teams, "teamID") };
    this.data.teams.push(team);
    return team;
  }
  async update(teamID: number, input: TeamChanges) {
    const team = await this.findById(teamID);
    if (!team) throw new Error("Cannot update a missing team.");
    Object.assign(team, input);
    return team;
  }
  async addMember(teamID: number, userID: number) {
    this.data.userTeams.push({ teamID, userID });
  }
  async removeMember(teamID: number, userID: number) {
    this.data.userTeams = this.data.userTeams.filter(
      (link) => !(link.teamID === teamID && link.userID === userID),
    );
  }
}
