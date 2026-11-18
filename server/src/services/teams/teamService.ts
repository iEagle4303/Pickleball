import type { UnitOfWork } from "../../repositories/interfaces/UnitOfWork.js";
import type { AuthUser, Team, TeamDetails } from "../../types/entities.js";
import { ensure } from "../errors.js";
import { teamSchema, membershipSchema } from "../validation.js";
import { requireTeam, requireUser } from "../shared/records.js";
import { teamView } from "../mappers/teamView.js";
import { tournamentView } from "../mappers/tournamentView.js";
import { gameView } from "../mappers/gameView.js";
export class TeamService {
  constructor(private readonly work: UnitOfWork) {}
  list() {
    return this.work.query(async (repositories) => {
      const teams = await repositories.teams.list();
      return Promise.all(teams.map((team) => teamView(repositories, team)));
    });
  }
  get(teamID: number): Promise<TeamDetails> {
    return this.work.query(async (repositories) => {
      const team = await requireTeam(repositories.teams, teamID);
      const [view, tournaments, games] = await Promise.all([
        teamView(repositories, team),
        repositories.tournaments.listForTeam(teamID),
        repositories.games.list({ teamID }),
      ]);
      return {
        ...view,
        tournaments: await Promise.all(
          tournaments.map((tournament) =>
            tournamentView(repositories, tournament),
          ),
        ),
        games: await Promise.all(
          games.map((game) => gameView(repositories, game)),
        ),
      };
    });
  }
  create(input: unknown, actor: AuthUser) {
    return this.save(input, actor);
  }
  update(teamID: number, input: unknown, actor: AuthUser) {
    return this.save(input, actor, teamID);
  }
  private canManage(actor: AuthUser, team: Team) {
    return (
      actor.permissions.includes("MANAGE_TEAMS") ||
      team.createdByUserID === actor.userID
    );
  }
  private save(input: unknown, actor: AuthUser, teamID?: number) {
    const value = teamSchema.parse(input);
    return this.work.transaction(async (repositories) => {
      if (teamID !== undefined) {
        const team = await requireTeam(repositories.teams, teamID);
        ensure(
          this.canManage(actor, team),
          403,
          "Only the team creator or a team administrator may edit this team.",
        );
      } else {
        await requireUser(repositories.users, actor.userID);
      }
      const existing = await repositories.teams.findByName(value.name);
      ensure(
        !existing || existing.teamID === teamID,
        409,
        "A team with this name already exists.",
      );
      const team =
        teamID === undefined
          ? await repositories.teams.create({
              ...value,
              createdByUserID: actor.userID,
            })
          : await repositories.teams.update(teamID, value);
      if (teamID === undefined)
        await repositories.teams.addMember(team.teamID, actor.userID);
      return teamView(repositories, team);
    });
  }
  addMember(teamID: number, input: unknown, actor: AuthUser) {
    const { userID } = membershipSchema.parse(input);
    return this.work.transaction(async (repositories) => {
      const team = await requireTeam(repositories.teams, teamID);
      ensure(
        userID === actor.userID || this.canManage(actor, team),
        403,
        "You cannot add another player to this team.",
      );
      await requireUser(repositories.users, userID);
      ensure(
        !(await repositories.teams.hasMember(teamID, userID)),
        409,
        "This player is already on the team.",
      );
      const members = await repositories.teams.listMembers(teamID);
      ensure(
        members.length < 2,
        409,
        "This doubles team already has two players.",
      );
      await repositories.teams.addMember(teamID, userID);
      return teamView(repositories, team);
    });
  }
  removeMember(teamID: number, userID: number, actor: AuthUser) {
    return this.work.transaction(async (repositories) => {
      const team = await requireTeam(repositories.teams, teamID);
      ensure(
        userID === actor.userID || this.canManage(actor, team),
        403,
        "You cannot remove this player.",
      );
      ensure(
        await repositories.teams.hasMember(teamID, userID),
        404,
        "Membership not found.",
      );
      await repositories.teams.removeMember(teamID, userID);
      return teamView(repositories, team);
    });
  }
}
