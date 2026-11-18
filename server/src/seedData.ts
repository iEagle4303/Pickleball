import type { Tournament } from "./types/entities.js";
import type { JsonDatabase } from "./repositories/json/JsonDatabase.js";
import { permissionNames } from "./types/entities.js";
import { hashPassword } from "./services/auth/passwords.js";
export async function createSeedData(
  password = process.env.SEED_PASSWORD || "Clubhouse2026!",
): Promise<JsonDatabase> {
  if (
    process.env.NODE_ENV === "production" &&
    (!process.env.SEED_PASSWORD || process.env.SEED_PASSWORD.length < 12)
  )
    throw new Error(
      "Set SEED_PASSWORD (12+ characters) before creating production data.",
    );
  const names = [
    "Jamie Chen",
    "Alex Morgan",
    "Sam Rivera",
    "Taylor Brooks",
    "Jordan Lee",
    "Casey Wilson",
    "Riley Patel",
    "Morgan Davis",
    "Avery Kim",
    "Quinn Martinez",
    "Cameron Scott",
    "Reese Johnson",
    "Dakota Nguyen",
    "Parker Adams",
    "Skyler Thomas",
    "Finley Garcia",
    "Club Administrator",
    "Score Coordinator",
  ];
  const users = await Promise.all(
    names.map(async (displayName, index) => ({
      userID: index + 1,
      username:
        index === 16
          ? "admin"
          : index === 17
            ? "scorer"
            : displayName.toLowerCase().replace(" ", "_"),
      displayName,
      email:
        (index === 16
          ? "admin"
          : index === 17
            ? "scorer"
            : displayName.toLowerCase().replace(" ", ".")) + "@example.edu",
      passwordHash: await hashPassword(password),
    })),
  );
  const teams = [
    "Kitchen Confidential",
    "Dink Dynasty",
    "The Volley Llamas",
    "Net Results",
    "Paddle Pals",
    "Drop Shot Society",
    "No Fault Found",
    "The Third Shots",
  ].map((name, index) => ({
    teamID: index + 1,
    name,
    color: [
      "lime",
      "blue",
      "orange",
      "purple",
      "teal",
      "rose",
      "blue",
      "orange",
    ][index],
    createdByUserID: index * 2 + 1,
  }));
  const make = (
    tournamentID: number,
    name: string,
    semester: string,
    status: Tournament["status"],
    startDate: string,
    endDate: string,
    parentTournamentID: number | null = null,
  ): Tournament => ({
    tournamentID,
    name,
    semester,
    status,
    startDate,
    endDate,
    parentTournamentID,
    type: "ladder",
    description:
      "Good rallies. Great people. A little friendly competition. Partner up and work your way up the club ladder.",
    location: "Sports & Fitness Center · Courts 1–4",
  });
  const tournaments = [
    make(
      1,
      "Fall Ladder League",
      "Fall 2026",
      "active",
      "2026-09-14",
      "2026-12-04",
    ),
    make(
      2,
      "Friday Open Division",
      "Fall 2026",
      "active",
      "2026-09-18",
      "2026-12-04",
      1,
    ),
    make(
      3,
      "Spring Ladder League",
      "Spring 2026",
      "completed",
      "2026-02-02",
      "2026-05-01",
    ),
    make(
      4,
      "Fall Ladder League",
      "Fall 2025",
      "completed",
      "2025-09-15",
      "2025-12-05",
    ),
    make(
      5,
      "Spring Ladder League",
      "Spring 2027",
      "upcoming",
      "2027-02-01",
      "2027-04-30",
    ),
  ];
  const data: JsonDatabase = {
    users,
    teams,
    permissions: permissionNames.map((description, index) => ({
      permissionID: index + 1,
      description,
    })),
    tournaments,
    games: [],
    userTeams: teams.flatMap((team) => [
      { teamID: team.teamID, userID: (team.teamID - 1) * 2 + 1 },
      { teamID: team.teamID, userID: (team.teamID - 1) * 2 + 2 },
    ]),
    userPermissions: permissionNames
      .map((_, index) => ({ userID: 17, permissionID: index + 1 }))
      .concat([
        { userID: 18, permissionID: 4 },
        { userID: 18, permissionID: 5 },
      ]),
    teamTournaments: tournaments.flatMap((tournament) =>
      teams
        .filter((team) => tournament.tournamentID !== 2 || team.teamID <= 4)
        .map((team) => ({
          teamID: team.teamID,
          tournamentID: tournament.tournamentID,
        })),
    ),
    sessions: [],
  };
  let seed = 42;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (const [tournamentID, count, date] of [
    [1, 28, "2026-11-15"],
    [2, 8, "2026-11-13"],
    [3, 24, "2026-04-30"],
    [4, 20, "2025-12-04"],
  ] as const) {
    const ids = data.teamTournaments
      .filter((link) => link.tournamentID === tournamentID)
      .map((link) => link.teamID);
    for (let index = 0; index < count; index++) {
      const a = ids[Math.floor(random() * ids.length)];
      let b = a;
      while (b === a) b = ids[Math.floor(random() * ids.length)];
      const winner = random() < 0.7 ? Math.min(a, b) : Math.max(a, b);
      const loser = winner === a ? b : a;
      const playedAt = new Date(date + "T23:00:00.000Z");
      playedAt.setUTCDate(playedAt.getUTCDate() - Math.floor(index / 4) * 7);
      playedAt.setUTCMinutes(playedAt.getUTCMinutes() - (index % 4) * 25);
      data.games.push({
        gameID: data.games.length + 1,
        winnerTeamID: winner,
        loserTeamID: loser,
        scoreWinner: 11,
        scoreLoser: Math.floor(random() * 10),
        tournamentID,
        playedAt: playedAt.toISOString(),
      });
    }
  }
  return data;
}
