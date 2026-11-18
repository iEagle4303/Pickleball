import type {
  GameRepository,
  GameFilters,
  GameChanges,
} from "../interfaces/GameRepository.js";
import type { JsonDatabase } from "./JsonDatabase.js";
import { nextID } from "./identity.js";
export class JsonGameRepository implements GameRepository {
  constructor(private readonly data: JsonDatabase) {}
  private filter(filters: GameFilters = {}) {
    return this.data.games.filter(
      (game) =>
        (filters.tournamentID === undefined ||
          game.tournamentID === filters.tournamentID) &&
        (filters.teamID === undefined ||
          game.winnerTeamID === filters.teamID ||
          game.loserTeamID === filters.teamID),
    );
  }
  async list(filters: GameFilters = {}) {
    const games = this.filter(filters).sort(
      (a, b) => b.playedAt.localeCompare(a.playedAt) || b.gameID - a.gameID,
    );
    return filters.limit === undefined ? games : games.slice(0, filters.limit);
  }
  async count(filters: Omit<GameFilters, "limit"> = {}) {
    return this.filter(filters).length;
  }
  async findById(gameID: number) {
    return this.data.games.find((game) => game.gameID === gameID) ?? null;
  }
  async getTeamRecord(teamID: number, tournamentID?: number) {
    const games = this.filter({ teamID, tournamentID });
    return {
      wins: games.filter((game) => game.winnerTeamID === teamID).length,
      losses: games.filter((game) => game.loserTeamID === teamID).length,
    };
  }
  async create(input: GameChanges) {
    const game = { ...input, gameID: nextID(this.data.games, "gameID") };
    this.data.games.push(game);
    return game;
  }
  async update(gameID: number, input: GameChanges) {
    const game = await this.findById(gameID);
    if (!game) throw new Error("Cannot update a missing game.");
    Object.assign(game, input);
    return game;
  }
  async remove(gameID: number) {
    this.data.games = this.data.games.filter((game) => game.gameID !== gameID);
  }
}
