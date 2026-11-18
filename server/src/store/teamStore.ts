import type { Team, TeamDetails, TeamView } from "../types/entities.js";
import type { TransactionScope } from "./types.js";
import { JsonScopedStore, JsonStoreSession } from "./json/JsonStoreSession.js";
import { nextID } from "./json/identity.js";
import { teamView, tournamentView, gameView, listGames } from "./json/views.js";
/**
 * Data-access contract for TeamService, independent of JSON or SQL storage.
 */
export interface TeamStore extends TransactionScope<TeamStore> {
  /**
   * Lists teams with their current public rosters and aggregate result statistics.
   *
   * @returns An array of team identity, public roster, and aggregate game statistics.
   */
  list(): Promise<TeamView[]>;
  /**
   * Loads the record with its related teams, members, tournaments, or completed-game history.
   *
   * @param teamID - Primary key of the team.
   * @returns Team profile, roster, tournament appearances, and completed-game history. Returns null when no matching record exists.
   */
  getDetails(teamID: number): Promise<TeamDetails | null>;
  /**
   * Looks up a team by its primary key.
   *
   * @param teamID - Primary key of the team.
   * @returns Team identity and creator reference. Returns null when no matching record exists.
   */
  getTeam(teamID: number): Promise<Team | null>;
  /**
   * Builds the summary view for a record already confirmed to exist.
   *
   * @param teamID - Primary key of the team.
   * @returns Team identity, public roster, and aggregate game statistics.
   */
  getView(teamID: number): Promise<TeamView>;
  /**
   * Looks up a team name using a case-insensitive comparison.
   *
   * @param name - Display name or case-insensitive team name to look up.
   * @returns Team identity and creator reference. Returns null when no matching record exists.
   */
  findByName(name: string): Promise<Team | null>;
  /**
   * Checks whether the user primary key exists.
   *
   * @param userID - Primary key of the user.
   * @returns True when the described check succeeds; otherwise false.
   */
  userExists(userID: number): Promise<boolean>;
  /**
   * Checks the exact team/user membership relationship.
   *
   * @param teamID - Primary key of the team.
   * @param userID - Primary key of the user.
   * @returns True when the described check succeeds; otherwise false.
   */
  hasMember(teamID: number, userID: number): Promise<boolean>;
  /**
   * Counts the players currently linked to a team.
   *
   * @param teamID - Primary key of the team.
   * @returns The computed nonnegative count or positive identifier.
   */
  countMembers(teamID: number): Promise<number>;
  /**
   * Inserts a team with a generated primary key; membership is managed separately.
   *
   * @param name - Display name or case-insensitive team name to look up.
   * @param color - Supported team accent-color name.
   * @param createdByUserID - User ID recorded as the team's creator.
   * @returns Team identity and creator reference.
   */
  createTeam(
    name: string,
    color: string,
    createdByUserID: number,
  ): Promise<Team>;
  /**
   * Updates only the selected team's name and color.
   *
   * @param teamID - Primary key of the team.
   * @param name - Display name or case-insensitive team name to look up.
   * @param color - Supported team accent-color name.
   * @returns Resolves when the operation completes; no result value is returned.
   */
  updateTeam(teamID: number, name: string, color: string): Promise<void>;
  /**
   * Inserts a team/user membership after service validation.
   *
   * @param teamID - Primary key of the team.
   * @param userID - Primary key of the user.
   * @returns Resolves when the operation completes; no result value is returned.
   */
  addMember(teamID: number, userID: number): Promise<void>;
  /**
   * Removes only the selected team/user membership.
   *
   * @param teamID - Primary key of the team.
   * @param userID - Primary key of the user.
   * @returns Resolves when the operation completes; no result value is returned.
   */
  removeMember(teamID: number, userID: number): Promise<void>;
}
/**
 * JSON implementation of TeamStore; SQL implementations can provide the same public contract.
 */
export class JsonTeamStore
  extends JsonScopedStore<TeamStore>
  implements TeamStore
{
  /**
   * Creates the same feature-store implementation bound to a supplied JSON scope.
   *
   * @param session - JSON scope to bind to this feature store.
   * @returns The feature-store instance bound to the supplied scope.
   */
  protected bind(session: JsonStoreSession): TeamStore {
    return new JsonTeamStore(session);
  }
  /**
   * Lists teams with their current public rosters and aggregate result statistics.
   *
   * @returns An array of team identity, public roster, and aggregate game statistics.
   */
  list(): Promise<TeamView[]> {
    return this.session.read((data) =>
      data.teams.map((team) => teamView(data, team)),
    );
  }
  /**
   * Looks up a team by its primary key.
   *
   * @param teamID - Primary key of the team.
   * @returns Team identity and creator reference. Returns null when no matching record exists.
   */
  getTeam(teamID: number): Promise<Team | null> {
    return this.session.read(
      (data) => data.teams.find((team) => team.teamID === teamID) ?? null,
    );
  }
  /**
   * Loads the record with its related teams, members, tournaments, or completed-game history.
   *
   * @param teamID - Primary key of the team.
   * @returns Team profile, roster, tournament appearances, and completed-game history. Returns null when no matching record exists.
   */
  getDetails(teamID: number): Promise<TeamDetails | null> {
    return this.session.read((data) => {
      const team = data.teams.find((team) => team.teamID === teamID);
      if (!team) return null;
      const ids = new Set(
        data.teamTournaments
          .filter((link) => link.teamID === teamID)
          .map((link) => link.tournamentID),
      );
      return {
        ...teamView(data, team),
        tournaments: data.tournaments
          .filter((tournament) => ids.has(tournament.tournamentID))
          .map((tournament) => tournamentView(data, tournament)),
        games: listGames(data, undefined, teamID).map((game) =>
          gameView(data, game),
        ),
      };
    });
  }
  /**
   * Builds the summary view for a record already confirmed to exist.
   *
   * @param teamID - Primary key of the team.
   * @returns Team identity, public roster, and aggregate game statistics.
   */
  getView(teamID: number): Promise<TeamView> {
    return this.session.read((data) => {
      const team = data.teams.find((team) => team.teamID === teamID);
      if (!team) throw new Error("Cannot load a missing team.");
      return teamView(data, team);
    });
  }
  /**
   * Looks up a team name using a case-insensitive comparison.
   *
   * @param name - Display name or case-insensitive team name to look up.
   * @returns Team identity and creator reference. Returns null when no matching record exists.
   */
  findByName(name: string): Promise<Team | null> {
    return this.session.read(
      (data) =>
        data.teams.find(
          (team) => team.name.toLowerCase() === name.toLowerCase(),
        ) ?? null,
    );
  }
  /**
   * Checks whether the user primary key exists.
   *
   * @param userID - Primary key of the user.
   * @returns True when the described check succeeds; otherwise false.
   */
  userExists(userID: number): Promise<boolean> {
    return this.session.read((data) =>
      data.users.some((user) => user.userID === userID),
    );
  }
  /**
   * Checks the exact team/user membership relationship.
   *
   * @param teamID - Primary key of the team.
   * @param userID - Primary key of the user.
   * @returns True when the described check succeeds; otherwise false.
   */
  hasMember(teamID: number, userID: number): Promise<boolean> {
    return this.session.read((data) =>
      data.userTeams.some(
        (link) => link.teamID === teamID && link.userID === userID,
      ),
    );
  }
  /**
   * Counts the players currently linked to a team.
   *
   * @param teamID - Primary key of the team.
   * @returns The computed nonnegative count or positive identifier.
   */
  countMembers(teamID: number): Promise<number> {
    return this.session.read(
      (data) => data.userTeams.filter((link) => link.teamID === teamID).length,
    );
  }
  /**
   * Inserts a team with a generated primary key; membership is managed separately.
   *
   * @param name - Display name or case-insensitive team name to look up.
   * @param color - Supported team accent-color name.
   * @param createdByUserID - User ID recorded as the team's creator.
   * @returns Team identity and creator reference.
   */
  createTeam(
    name: string,
    color: string,
    createdByUserID: number,
  ): Promise<Team> {
    return this.session.write((data) => {
      const team = {
        teamID: nextID(data.teams, "teamID"),
        name,
        color,
        createdByUserID,
      };
      data.teams.push(team);
      return team;
    });
  }
  /**
   * Updates only the selected team's name and color.
   *
   * @param teamID - Primary key of the team.
   * @param name - Display name or case-insensitive team name to look up.
   * @param color - Supported team accent-color name.
   * @returns Resolves when the operation completes; no result value is returned.
   */
  updateTeam(teamID: number, name: string, color: string): Promise<void> {
    return this.session.write((data) => {
      const team = data.teams.find((team) => team.teamID === teamID);
      if (!team) throw new Error("Cannot update a missing team.");
      team.name = name;
      team.color = color;
    });
  }
  /**
   * Inserts a team/user membership after service validation.
   *
   * @param teamID - Primary key of the team.
   * @param userID - Primary key of the user.
   * @returns Resolves when the operation completes; no result value is returned.
   */
  addMember(teamID: number, userID: number): Promise<void> {
    return this.session.write((data) => {
      data.userTeams.push({ teamID, userID });
    });
  }
  /**
   * Removes only the selected team/user membership.
   *
   * @param teamID - Primary key of the team.
   * @param userID - Primary key of the user.
   * @returns Resolves when the operation completes; no result value is returned.
   */
  removeMember(teamID: number, userID: number): Promise<void> {
    return this.session.write((data) => {
      data.userTeams = data.userTeams.filter(
        (link) => !(link.teamID === teamID && link.userID === userID),
      );
    });
  }
}
