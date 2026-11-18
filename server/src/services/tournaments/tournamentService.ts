import type { UnitOfWork } from "../../repositories/interfaces/UnitOfWork.js";
import type { TournamentDetails } from "../../types/entities.js";
import { ensure } from "../errors.js";
import { tournamentSchema, participationSchema } from "../validation.js";
import { requireTeam, requireTournament } from "../shared/records.js";
import { tournamentView } from "../mappers/tournamentView.js";
import { teamView } from "../mappers/teamView.js";
import { gameView } from "../mappers/gameView.js";
export class TournamentService {
  constructor(private readonly work: UnitOfWork) {}
  list() {
    return this.work.query(async (repositories) => {
      const tournaments = await repositories.tournaments.list();
      return Promise.all(
        tournaments.map((tournament) =>
          tournamentView(repositories, tournament),
        ),
      );
    });
  }
  get(tournamentID: number): Promise<TournamentDetails> {
    return this.work.query(async (repositories) => {
      const tournament = await requireTournament(
        repositories.tournaments,
        tournamentID,
      );
      const [view, teams, games, children, parent] = await Promise.all([
        tournamentView(repositories, tournament),
        repositories.teams.listForTournament(tournamentID),
        repositories.games.list({ tournamentID }),
        repositories.tournaments.listChildren(tournamentID),
        tournament.parentTournamentID === null
          ? null
          : repositories.tournaments.findById(tournament.parentTournamentID),
      ]);
      return {
        ...view,
        teams: await Promise.all(
          teams.map((team) => teamView(repositories, team, tournamentID)),
        ),
        games: await Promise.all(
          games.map((game) => gameView(repositories, game)),
        ),
        children: await Promise.all(
          children.map((child) => tournamentView(repositories, child)),
        ),
        parent,
      };
    });
  }
  create(input: unknown) {
    return this.save(input);
  }
  update(tournamentID: number, input: unknown) {
    return this.save(input, tournamentID);
  }
  private save(input: unknown, tournamentID?: number) {
    const value = tournamentSchema.parse(input);
    return this.work.transaction(async (repositories) => {
      if (tournamentID !== undefined)
        await requireTournament(repositories.tournaments, tournamentID);
      if (value.parentTournamentID !== null) {
        const parent = await requireTournament(
          repositories.tournaments,
          value.parentTournamentID,
        );
        ensure(
          parent.semester === value.semester,
          400,
          "Parent and child must use the same semester.",
        );
        const visited = new Set<number>();
        let ancestor: typeof parent | null = parent;
        while (ancestor) {
          ensure(
            ancestor.tournamentID !== tournamentID &&
              !visited.has(ancestor.tournamentID),
            400,
            "Parent relationship would create a cycle.",
          );
          visited.add(ancestor.tournamentID);
          ancestor =
            ancestor.parentTournamentID === null
              ? null
              : await requireTournament(
                  repositories.tournaments,
                  ancestor.parentTournamentID,
                );
        }
      }
      if (tournamentID !== undefined) {
        const children =
          await repositories.tournaments.listChildren(tournamentID);
        ensure(
          children.every((child) => child.semester === value.semester),
          400,
          "Update child semesters before changing this parent semester.",
        );
      }
      const tournament =
        tournamentID === undefined
          ? await repositories.tournaments.create(value)
          : await repositories.tournaments.update(tournamentID, value);
      return tournamentView(repositories, tournament);
    });
  }
  remove(tournamentID: number) {
    return this.work.transaction(async (repositories) => {
      await requireTournament(repositories.tournaments, tournamentID);
      ensure(
        (await repositories.games.count({ tournamentID })) === 0,
        409,
        "Remove this tournament's results before deleting it.",
      );
      const children =
        await repositories.tournaments.listChildren(tournamentID);
      ensure(children.length === 0, 409, "Remove child tournaments first.");
      await repositories.tournaments.remove(tournamentID);
      return null;
    });
  }
  setParticipants(tournamentID: number, input: unknown) {
    const { teamIDs } = participationSchema.parse(input);
    return this.work.transaction(async (repositories) => {
      await requireTournament(repositories.tournaments, tournamentID);
      await Promise.all(
        teamIDs.map((teamID) => requireTeam(repositories.teams, teamID)),
      );
      const games = await repositories.games.list({ tournamentID });
      const selected = new Set(teamIDs);
      ensure(
        games.every(
          (game) =>
            selected.has(game.winnerTeamID) && selected.has(game.loserTeamID),
        ),
        409,
        "Teams with recorded results must remain in the tournament.",
      );
      await repositories.tournaments.replaceTeams(tournamentID, teamIDs);
      return teamIDs;
    });
  }
}
