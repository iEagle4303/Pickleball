import type { TeamView, TeamDetails } from "../../types/entities.js";
import type { TeamStore } from "../../store/teamStore.js";
import { ensure } from "../errors.js";
import { teamSchema, membershipSchema } from "../validation.js";
/**
 * Coordinates team creation, editing, and doubles-roster rules through TeamStore.
 */
export class TeamService {
  /**
   * Creates the TeamService with its required dependencies.
   *
   * @param store - Dedicated feature-store dependency, scoped when used inside a transaction.
   */
  constructor(private readonly store: TeamStore) {}
  /**
   * Lists all teams with their rosters and aggregate records.
   *
   * @returns An array of team identity, public roster, and aggregate game statistics.
   */
  list(): Promise<TeamView[]> {
    return this.store.list();
  }
  /**
   * Loads one team's profile, members, tournament appearances, and game history.
   *
   * @param teamID - Primary key of the team.
   * @returns Team profile, roster, tournament appearances, and completed-game history.
   * @throws {HttpError} If the team does not exist.
   */
  async get(teamID: number): Promise<TeamDetails> {
    const team = await this.store.getDetails(teamID);
    ensure(team, 404, "Team not found.");
    return team;
  }
  /**
   * Validates the creator and name, then creates the team and first membership atomically.
   *
   * @param input - Request fields to validate before applying the operation.
   * @param createdByUserID - User ID recorded as the team's creator.
   * @returns Team identity, public roster, and aggregate game statistics.
   * @throws {HttpError} If the creator is missing or the team name is already in use.
   * @throws {ZodError} If the submitted fields or ID list fail validation.
   */
  create(input: unknown, createdByUserID: number): Promise<TeamView> {
    const value = teamSchema.parse(input);
    return this.store.transaction(async (store) => {
      ensure(await store.userExists(createdByUserID), 404, "User not found.");
      ensure(
        !(await store.findByName(value.name)),
        409,
        "A team with this name already exists.",
      );
      const team = await store.createTeam(
        value.name,
        value.color,
        createdByUserID,
      );
      await store.addMember(team.teamID, createdByUserID);
      return store.getView(team.teamID);
    });
  }
  /**
   * Checks ownership or team-management permission before changing team details.
   *
   * @param teamID - Primary key of the team.
   * @param input - Request fields to validate before applying the operation.
   * @param actorUserID - Signed-in user ID used for ownership checks.
   * @param canManageTeams - Whether the signed-in user has MANAGE_TEAMS permission.
   * @returns Team identity, public roster, and aggregate game statistics.
   * @throws {HttpError} If the team is missing, the caller cannot edit it, or the name is already in use.
   * @throws {ZodError} If the submitted fields or ID list fail validation.
   */
  update(
    teamID: number,
    input: unknown,
    actorUserID: number,
    canManageTeams: boolean,
  ): Promise<TeamView> {
    const value = teamSchema.parse(input);
    return this.store.transaction(async (store) => {
      const team = await store.getTeam(teamID);
      ensure(team, 404, "Team not found.");
      ensure(
        canManageTeams || team.createdByUserID === actorUserID,
        403,
        "Only the team creator or a team administrator may edit this team.",
      );
      const existing = await store.findByName(value.name);
      ensure(
        !existing || existing.teamID === teamID,
        409,
        "A team with this name already exists.",
      );
      await store.updateTeam(teamID, value.name, value.color);
      return store.getView(teamID);
    });
  }
  /**
   * Checks authorization, membership uniqueness, and doubles capacity before adding a player.
   *
   * @param teamID - Primary key of the team.
   * @param userID - Primary key of the user.
   * @param actorUserID - Signed-in user ID used for ownership checks.
   * @param canManageTeams - Whether the signed-in user has MANAGE_TEAMS permission.
   * @returns Team identity, public roster, and aggregate game statistics.
   * @throws {HttpError} If authorization fails, a record is missing, the member already joined, or the doubles roster is full.
   */
  addMember(
    teamID: number,
    userID: unknown,
    actorUserID: number,
    canManageTeams: boolean,
  ): Promise<TeamView> {
    const memberUserID = membershipSchema.shape.userID.parse(userID);
    return this.store.transaction(async (store) => {
      const team = await store.getTeam(teamID);
      ensure(team, 404, "Team not found.");
      ensure(
        memberUserID === actorUserID ||
          canManageTeams ||
          team.createdByUserID === actorUserID,
        403,
        "You cannot add another player to this team.",
      );
      ensure(await store.userExists(memberUserID), 404, "User not found.");
      ensure(
        !(await store.hasMember(teamID, memberUserID)),
        409,
        "This player is already on the team.",
      );
      ensure(
        (await store.countMembers(teamID)) < 2,
        409,
        "This doubles team already has two players.",
      );
      await store.addMember(teamID, memberUserID);
      return store.getView(teamID);
    });
  }
  /**
   * Checks authorization and the exact membership before removing a player.
   *
   * @param teamID - Primary key of the team.
   * @param userID - Primary key of the user.
   * @param actorUserID - Signed-in user ID used for ownership checks.
   * @param canManageTeams - Whether the signed-in user has MANAGE_TEAMS permission.
   * @returns Team identity, public roster, and aggregate game statistics.
   * @throws {HttpError} If authorization fails or the team/membership does not exist.
   */
  removeMember(
    teamID: number,
    userID: number,
    actorUserID: number,
    canManageTeams: boolean,
  ): Promise<TeamView> {
    return this.store.transaction(async (store) => {
      const team = await store.getTeam(teamID);
      ensure(team, 404, "Team not found.");
      ensure(
        userID === actorUserID ||
          canManageTeams ||
          team.createdByUserID === actorUserID,
        403,
        "You cannot remove this player.",
      );
      ensure(
        await store.hasMember(teamID, userID),
        404,
        "Membership not found.",
      );
      await store.removeMember(teamID, userID);
      return store.getView(teamID);
    });
  }
}
