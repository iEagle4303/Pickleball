import type { ReadRepositories } from "../../repositories/interfaces/UnitOfWork.js";
import type { Team, TeamView } from "../../types/entities.js";
export async function teamView(
  repositories: Pick<ReadRepositories, "teams" | "games">,
  team: Team,
  tournamentID?: number,
): Promise<TeamView> {
  const [members, record] = await Promise.all([
    repositories.teams.listMembers(team.teamID),
    repositories.games.getTeamRecord(team.teamID, tournamentID),
  ]);
  const gamesPlayed = record.wins + record.losses;
  return {
    ...team,
    members,
    ...record,
    gamesPlayed,
    winPercentage: gamesPlayed ? (record.wins / gamesPlayed) * 100 : 0,
  };
}
