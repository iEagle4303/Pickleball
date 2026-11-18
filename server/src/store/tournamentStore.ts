import type {
  Game,
  Tournament,
  TournamentDetails,
  TournamentView,
} from "../types/entities.js";
import type { TransactionScope, TournamentInput } from "./types.js";
import { JsonScopedStore, JsonStoreSession } from "./json/JsonStoreSession.js";
import { nextID } from "./json/identity.js";
import { tournamentView, teamView, gameView, listGames } from "./json/views.js";
/**
 * Data-access contract for TournamentService, independent of JSON or SQL storage.
 */
export interface TournamentStore extends TransactionScope<TournamentStore> {
  /**
   * Lists tournament summaries with participation and completed-game counts.
   *
   * @returns An array of tournament summary with participant and completed-game counts.
   */
  list(): Promise<TournamentView[]>;
  /**
   * Loads the record with its related teams, members, tournaments, or completed-game history.
   *
   * @param tournamentID - Primary key of the tournament.
   * @returns Tournament details with scoped teams, games, parent, and child stages. Returns null when no matching record exists.
   */
  getDetails(tournamentID: number): Promise<TournamentDetails | null>;
  /**
   * Looks up a tournament by its primary key.
   *
   * @param tournamentID - Primary key of the tournament.
   * @returns Tournament identity, format, semester, dates, and hierarchy fields. Returns null when no matching record exists.
   */
  getTournament(tournamentID: number): Promise<Tournament | null>;
  /**
   * Builds the summary view for a record already confirmed to exist.
   *
   * @param tournamentID - Primary key of the tournament.
   * @returns Tournament summary with participant and completed-game counts.
   */
  getView(tournamentID: number): Promise<TournamentView>;
  /**
   * Lists the immediate child tournaments of a parent tournament.
   *
   * @param tournamentID - Primary key of the tournament.
   * @returns An array of tournament identity, format, semester, dates, and hierarchy fields.
   */
  getChildren(tournamentID: number): Promise<Tournament[]>;
  /**
   * Lists one tournament's completed games from newest to oldest.
   *
   * @param tournamentID - Primary key of the tournament.
   * @returns Completed games ordered by playedAt descending, then gameID descending.
   */
  getGames(tournamentID: number): Promise<Game[]>;
  /**
   * Counts completed games in one tournament.
   *
   * @param tournamentID - Primary key of the tournament.
   * @returns The computed nonnegative count or positive identifier.
   */
  countGames(tournamentID: number): Promise<number>;
  /**
   * Checks whether the team primary key exists.
   *
   * @param teamID - Primary key of the team.
   * @returns True when the described check succeeds; otherwise false.
   */
  teamExists(teamID: number): Promise<boolean>;
  /**
   * Inserts a tournament with a generated primary key.
   *
   * @param input - Complete record fields; the generated primary key is supplied or allocated separately.
   * @returns Tournament identity, format, semester, dates, and hierarchy fields.
   */
  createTournament(input: TournamentInput): Promise<Tournament>;
  /**
   * Replaces the selected tournament's editable fields.
   *
   * @param tournamentID - Primary key of the tournament.
   * @param input - Complete record fields; the generated primary key is supplied or allocated separately.
   * @returns Resolves when the operation completes; no result value is returned.
   */
  updateTournament(tournamentID: number, input: TournamentInput): Promise<void>;
  /**
   * Removes the selected tournament and its participation links after service validation.
   *
   * @param tournamentID - Primary key of the tournament.
   * @returns Resolves when the operation completes; no result value is returned.
   */
  removeTournament(tournamentID: number): Promise<void>;
  /**
   * Replaces only the selected tournament's participating-team relationships.
   *
   * @param tournamentID - Primary key of the tournament.
   * @param teamIDs - Team IDs to include in the tournament.
   * @returns Resolves when the operation completes; no result value is returned.
   */
  replaceTeams(tournamentID: number, teamIDs: readonly number[]): Promise<void>;
}
/**
 * JSON implementation of TournamentStore; SQL implementations can provide the same public contract.
 */
export class JsonTournamentStore
  extends JsonScopedStore<TournamentStore>
  implements TournamentStore
{
  /**
   * Creates the same feature-store implementation bound to a supplied JSON scope.
   *
   * @param session - JSON scope to bind to this feature store.
   * @returns The feature-store instance bound to the supplied scope.
   */
  protected bind(session: JsonStoreSession): TournamentStore {
    return new JsonTournamentStore(session);
  }
  /**
   * Lists tournament summaries with participation and completed-game counts.
   *
   * @returns An array of tournament summary with participant and completed-game counts.
   */
  list(): Promise<TournamentView[]> {
    return this.session.read((data) =>
      data.tournaments.map((tournament) => tournamentView(data, tournament)),
    );
  }
  /**
   * Looks up a tournament by its primary key.
   *
   * @param tournamentID - Primary key of the tournament.
   * @returns Tournament identity, format, semester, dates, and hierarchy fields. Returns null when no matching record exists.
   */
  getTournament(tournamentID: number): Promise<Tournament | null> {
    return this.session.read(
      (data) =>
        data.tournaments.find(
          (tournament) => tournament.tournamentID === tournamentID,
        ) ?? null,
    );
  }
  /**
   * Loads the record with its related teams, members, tournaments, or completed-game history.
   *
   * @param tournamentID - Primary key of the tournament.
   * @returns Tournament details with scoped teams, games, parent, and child stages. Returns null when no matching record exists.
   */
  getDetails(tournamentID: number): Promise<TournamentDetails | null> {
    return this.session.read((data) => {
      const tournament = data.tournaments.find(
        (tournament) => tournament.tournamentID === tournamentID,
      );
      if (!tournament) return null;
      const ids = new Set(
        data.teamTournaments
          .filter((link) => link.tournamentID === tournamentID)
          .map((link) => link.teamID),
      );
      return {
        ...tournamentView(data, tournament),
        teams: data.teams
          .filter((team) => ids.has(team.teamID))
          .map((team) => teamView(data, team, tournamentID)),
        games: listGames(data, tournamentID).map((game) =>
          gameView(data, game),
        ),
        children: data.tournaments
          .filter((child) => child.parentTournamentID === tournamentID)
          .map((child) => tournamentView(data, child)),
        parent:
          data.tournaments.find(
            (parent) => parent.tournamentID === tournament.parentTournamentID,
          ) ?? null,
      };
    });
  }
  /**
   * Builds the summary view for a record already confirmed to exist.
   *
   * @param tournamentID - Primary key of the tournament.
   * @returns Tournament summary with participant and completed-game counts.
   */
  getView(tournamentID: number): Promise<TournamentView> {
    return this.session.read((data) => {
      const tournament = data.tournaments.find(
        (tournament) => tournament.tournamentID === tournamentID,
      );
      if (!tournament) throw new Error("Cannot load a missing tournament.");
      return tournamentView(data, tournament);
    });
  }
  /**
   * Lists the immediate child tournaments of a parent tournament.
   *
   * @param tournamentID - Primary key of the tournament.
   * @returns An array of tournament identity, format, semester, dates, and hierarchy fields.
   */
  getChildren(tournamentID: number): Promise<Tournament[]> {
    return this.session.read((data) =>
      data.tournaments.filter(
        (child) => child.parentTournamentID === tournamentID,
      ),
    );
  }
  /**
   * Lists one tournament's completed games from newest to oldest.
   *
   * @param tournamentID - Primary key of the tournament.
   * @returns Completed games ordered by playedAt descending, then gameID descending.
   */
  getGames(tournamentID: number): Promise<Game[]> {
    return this.session.read((data) => listGames(data, tournamentID));
  }
  /**
   * Counts completed games in one tournament.
   *
   * @param tournamentID - Primary key of the tournament.
   * @returns The computed nonnegative count or positive identifier.
   */
  countGames(tournamentID: number): Promise<number> {
    return this.session.read(
      (data) =>
        data.games.filter((game) => game.tournamentID === tournamentID).length,
    );
  }
  /**
   * Checks whether the team primary key exists.
   *
   * @param teamID - Primary key of the team.
   * @returns True when the described check succeeds; otherwise false.
   */
  teamExists(teamID: number): Promise<boolean> {
    return this.session.read((data) =>
      data.teams.some((team) => team.teamID === teamID),
    );
  }
  /**
   * Inserts a tournament with a generated primary key.
   *
   * @param input - Complete record fields; the generated primary key is supplied or allocated separately.
   * @returns Tournament identity, format, semester, dates, and hierarchy fields.
   */
  createTournament(input: TournamentInput): Promise<Tournament> {
    return this.session.write((data) => {
      const tournament = {
        ...input,
        tournamentID: nextID(data.tournaments, "tournamentID"),
      };
      data.tournaments.push(tournament);
      return tournament;
    });
  }
  /**
   * Replaces the selected tournament's editable fields.
   *
   * @param tournamentID - Primary key of the tournament.
   * @param input - Complete record fields; the generated primary key is supplied or allocated separately.
   * @returns Resolves when the operation completes; no result value is returned.
   */
  updateTournament(
    tournamentID: number,
    input: TournamentInput,
  ): Promise<void> {
    return this.session.write((data) => {
      const tournament = data.tournaments.find(
        (tournament) => tournament.tournamentID === tournamentID,
      );
      if (!tournament) throw new Error("Cannot update a missing tournament.");
      Object.assign(tournament, input);
    });
  }
  /**
   * Removes the selected tournament and its participation links after service validation.
   *
   * @param tournamentID - Primary key of the tournament.
   * @returns Resolves when the operation completes; no result value is returned.
   */
  removeTournament(tournamentID: number): Promise<void> {
    return this.session.write((data) => {
      data.tournaments = data.tournaments.filter(
        (tournament) => tournament.tournamentID !== tournamentID,
      );
      data.teamTournaments = data.teamTournaments.filter(
        (link) => link.tournamentID !== tournamentID,
      );
    });
  }
  /**
   * Replaces only the selected tournament's participating-team relationships.
   *
   * @param tournamentID - Primary key of the tournament.
   * @param teamIDs - Team IDs to include in the tournament.
   * @returns Resolves when the operation completes; no result value is returned.
   */
  replaceTeams(
    tournamentID: number,
    teamIDs: readonly number[],
  ): Promise<void> {
    return this.session.write((data) => {
      data.teamTournaments = data.teamTournaments.filter(
        (link) => link.tournamentID !== tournamentID,
      );
      data.teamTournaments.push(
        ...teamIDs.map((teamID) => ({ teamID, tournamentID })),
      );
    });
  }
}
