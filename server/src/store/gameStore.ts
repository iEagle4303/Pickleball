import type { Game, GameView, Tournament } from "../types/entities.js";
import type { GameInput, TransactionScope } from "./types.js";
import { JsonScopedStore, JsonStoreSession } from "./json/JsonStoreSession.js";
import { nextID } from "./json/identity.js";
import { listGames, gameView } from "./json/views.js";
/**
 * Data-access contract for GameService, independent of JSON or SQL storage.
 */
export interface GameStore extends TransactionScope<GameStore> {
  /**
   * Lists completed game views filtered by optional tournament/team IDs, ordered newest first.
   *
   * @param tournamentID - Primary key of the tournament.
   * @param teamID - Primary key of the team.
   * @returns Joined game views ordered by playedAt descending, then gameID descending.
   */
  list(tournamentID?: number, teamID?: number): Promise<GameView[]>;
  /**
   * Looks up a completed game by its primary key.
   *
   * @param gameID - Primary key of the completed game.
   * @returns Completed result and its team/tournament foreign keys. Returns null when no matching record exists.
   */
  getGame(gameID: number): Promise<Game | null>;
  /**
   * Looks up a tournament by its primary key.
   *
   * @param tournamentID - Primary key of the tournament.
   * @returns Tournament identity, format, semester, dates, and hierarchy fields. Returns null when no matching record exists.
   */
  getTournament(tournamentID: number): Promise<Tournament | null>;
  /**
   * Checks whether the team primary key exists.
   *
   * @param teamID - Primary key of the team.
   * @returns True when the described check succeeds; otherwise false.
   */
  teamExists(teamID: number): Promise<boolean>;
  /**
   * Checks the exact tournament/team participation relationship.
   *
   * @param tournamentID - Primary key of the tournament.
   * @param teamID - Primary key of the team.
   * @returns True when the described check succeeds; otherwise false.
   */
  tournamentHasTeam(tournamentID: number, teamID: number): Promise<boolean>;
  /**
   * Inserts a completed game with a generated primary key and returns its joined view.
   *
   * @param input - Complete record fields; the generated primary key is supplied or allocated separately.
   * @returns Completed result joined to the winner, loser, and tournament.
   */
  createGame(input: GameInput): Promise<GameView>;
  /**
   * Updates a completed result and returns its joined view.
   *
   * @param gameID - Primary key of the completed game.
   * @param input - Complete record fields; the generated primary key is supplied or allocated separately.
   * @returns Completed result joined to the winner, loser, and tournament.
   */
  updateGame(gameID: number, input: GameInput): Promise<GameView>;
  /**
   * Removes only the completed game identified by its primary key.
   *
   * @param gameID - Primary key of the completed game.
   * @returns Resolves when the operation completes; no result value is returned.
   */
  removeGame(gameID: number): Promise<void>;
}
/**
 * JSON implementation of GameStore; SQL implementations can provide the same public contract.
 */
export class JsonGameStore
  extends JsonScopedStore<GameStore>
  implements GameStore
{
  /**
   * Creates the same feature-store implementation bound to a supplied JSON scope.
   *
   * @param session - JSON scope to bind to this feature store.
   * @returns The feature-store instance bound to the supplied scope.
   */
  protected bind(session: JsonStoreSession): GameStore {
    return new JsonGameStore(session);
  }
  /**
   * Lists completed game views filtered by optional tournament/team IDs, ordered newest first.
   *
   * @param tournamentID - Primary key of the tournament.
   * @param teamID - Primary key of the team.
   * @returns Joined game views ordered by playedAt descending, then gameID descending.
   */
  list(tournamentID?: number, teamID?: number): Promise<GameView[]> {
    return this.session.read((data) =>
      listGames(data, tournamentID, teamID).map((game) => gameView(data, game)),
    );
  }
  /**
   * Looks up a completed game by its primary key.
   *
   * @param gameID - Primary key of the completed game.
   * @returns Completed result and its team/tournament foreign keys. Returns null when no matching record exists.
   */
  getGame(gameID: number): Promise<Game | null> {
    return this.session.read(
      (data) => data.games.find((game) => game.gameID === gameID) ?? null,
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
   * Checks the exact tournament/team participation relationship.
   *
   * @param tournamentID - Primary key of the tournament.
   * @param teamID - Primary key of the team.
   * @returns True when the described check succeeds; otherwise false.
   */
  tournamentHasTeam(tournamentID: number, teamID: number): Promise<boolean> {
    return this.session.read((data) =>
      data.teamTournaments.some(
        (link) => link.tournamentID === tournamentID && link.teamID === teamID,
      ),
    );
  }
  /**
   * Inserts a completed game with a generated primary key and returns its joined view.
   *
   * @param input - Complete record fields; the generated primary key is supplied or allocated separately.
   * @returns Completed result joined to the winner, loser, and tournament.
   */
  createGame(input: GameInput): Promise<GameView> {
    return this.session.write((data) => {
      const game = { ...input, gameID: nextID(data.games, "gameID") };
      data.games.push(game);
      return gameView(data, game);
    });
  }
  /**
   * Updates a completed result and returns its joined view.
   *
   * @param gameID - Primary key of the completed game.
   * @param input - Complete record fields; the generated primary key is supplied or allocated separately.
   * @returns Completed result joined to the winner, loser, and tournament.
   */
  updateGame(gameID: number, input: GameInput): Promise<GameView> {
    return this.session.write((data) => {
      const game = data.games.find((game) => game.gameID === gameID);
      if (!game) throw new Error("Cannot update a missing game.");
      Object.assign(game, input);
      return gameView(data, game);
    });
  }
  /**
   * Removes only the completed game identified by its primary key.
   *
   * @param gameID - Primary key of the completed game.
   * @returns Resolves when the operation completes; no result value is returned.
   */
  removeGame(gameID: number): Promise<void> {
    return this.session.write((data) => {
      data.games = data.games.filter((game) => game.gameID !== gameID);
    });
  }
}
