import type { UnitOfWork } from "../../repositories/interfaces/UnitOfWork.js";
import type { GameFilters } from "../../repositories/interfaces/GameRepository.js";
import { ensure } from "../errors.js";
import { gameSchema } from "../validation.js";
import {
  requireGame,
  requireTeam,
  requireTournament,
} from "../shared/records.js";
import { gameView } from "../mappers/gameView.js";
export class GameService {
  constructor(private readonly work: UnitOfWork) {}
  list(filters: GameFilters = {}) {
    return this.work.query(async (repositories) => {
      if (filters.tournamentID !== undefined)
        await requireTournament(repositories.tournaments, filters.tournamentID);
      if (filters.teamID !== undefined)
        await requireTeam(repositories.teams, filters.teamID);
      const games = await repositories.games.list(filters);
      return Promise.all(games.map((game) => gameView(repositories, game)));
    });
  }
  create(input: unknown) {
    return this.save(input);
  }
  update(gameID: number, input: unknown) {
    return this.save(input, gameID);
  }
  private save(input: unknown, gameID?: number) {
    const value = gameSchema.parse(input);
    ensure(
      new Date(value.playedAt).getTime() <= Date.now() + 60000,
      400,
      "A completed game cannot be dated in the future.",
    );
    return this.work.transaction(async (repositories) => {
      if (gameID !== undefined) await requireGame(repositories.games, gameID);
      const tournament = await requireTournament(
        repositories.tournaments,
        value.tournamentID,
      );
      ensure(
        tournament.status !== "upcoming",
        400,
        "Start the tournament before entering results.",
      );
      for (const teamID of [value.winnerTeamID, value.loserTeamID]) {
        await requireTeam(repositories.teams, teamID);
        ensure(
          await repositories.tournaments.hasTeam(value.tournamentID, teamID),
          400,
          "Both teams must belong to this tournament.",
        );
      }
      const game =
        gameID === undefined
          ? await repositories.games.create(value)
          : await repositories.games.update(gameID, value);
      return gameView(repositories, game);
    });
  }
  remove(gameID: number) {
    return this.work.transaction(async (repositories) => {
      await requireGame(repositories.games, gameID);
      await repositories.games.remove(gameID);
      return null;
    });
  }
}
