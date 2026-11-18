import type { UnitOfWork } from "../../repositories/interfaces/UnitOfWork.js";
import type { HomeData } from "../../types/entities.js";
import { tournamentView } from "../mappers/tournamentView.js";
import { gameView } from "../mappers/gameView.js";
import { getRankings } from "../rankings/rankingService.js";
import { getMatchups } from "../matchups/matchupService.js";
export class HomeService {
  constructor(private readonly work: UnitOfWork) {}
  get(): Promise<HomeData> {
    return this.work.query(async (repositories) => {
      const tournaments = await repositories.tournaments.list();
      const active = tournaments.find(
        (tournament) =>
          tournament.status === "active" &&
          tournament.parentTournamentID === null,
      );
      const [members, teams, games, tournamentCount, recentGames] =
        await Promise.all([
          repositories.users.count(),
          repositories.teams.count(),
          repositories.games.count(),
          repositories.tournaments.count(),
          repositories.games.list({ limit: 5 }),
        ]);
      return {
        active: active ? await tournamentView(repositories, active) : null,
        tournaments: await Promise.all(
          tournaments.map((tournament) =>
            tournamentView(repositories, tournament),
          ),
        ),
        recentGames: await Promise.all(
          recentGames.map((game) => gameView(repositories, game)),
        ),
        rankings: active
          ? (await getRankings(repositories, active.tournamentID)).slice(0, 5)
          : [],
        matchups: active
          ? await getMatchups(repositories, active.tournamentID)
          : { matchups: [], bye: null },
        stats: { members, teams, games, tournaments: tournamentCount },
      };
    });
  }
}
