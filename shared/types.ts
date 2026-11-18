/** Supported authorization capability names used in shared types and seed data. */
export const permissionNames = [
  "CREATE_TOURNAMENT",
  "EDIT_TOURNAMENT",
  "MANAGE_TEAMS",
  "ADD_GAME_RESULT",
  "EDIT_GAME_RESULT",
  "DELETE_GAME_RESULT",
  "MANAGE_PERMISSIONS",
] as const;
/** Supported authorization capability checked by both the API and permitted frontend controls. */
export type PermissionName = (typeof permissionNames)[number];
/** Stored member account; never send passwordHash in an API response. */
export interface User {
  /** User primary key, or foreign key to the associated user in a relationship. */
  userID: number;
  /** Unique normalized login name. */
  username: string;
  /** Member name shown in the club interface. */
  displayName: string;
  /** Unique account email; exposed only in authorized account views. */
  email: string;
  /** Salted scrypt password hash; never plaintext and never part of public API views. */
  passwordHash: string;
}
/** Permission catalog record used by server-side authorization. */
export interface Permission {
  /** Permission primary key, or foreign key to a catalog permission in a relationship. */
  permissionID: number;
  /** Human-readable description or supported authorization capability. */
  description: PermissionName;
}
/** Doubles team identity and its creator's ownership reference. */
export interface Team {
  /** Team primary key, or foreign key to the associated team in a relationship. */
  teamID: number;
  /** Human-readable team or tournament display name. */
  name: string;
  /** Team accent-color identifier used by the interface. */
  color: string;
  /** Creator's user ID used for team ownership checks. */
  createdByUserID: number;
}
/** Competition record supporting semesters and an optional parent stage. */
export interface Tournament {
  /** Tournament primary key, or foreign key to the associated tournament in a relationship. */
  tournamentID: number;
  /** Human-readable team or tournament display name. */
  name: string;
  /** Competition format: ladder, bracket, or round-robin. */
  type: "ladder" | "bracket" | "round-robin";
  /** Parent tournament ID, or null for a standalone competition. */
  parentTournamentID: number | null;
  /** Semester label grouping tournaments, such as Fall 2026. */
  semester: string;
  /** Lifecycle state controlling whether the competition is upcoming, active, or completed. */
  status: "active" | "upcoming" | "completed";
  /** Human-readable description or supported authorization capability. */
  description: string;
  /** Competition start date in YYYY-MM-DD format. */
  startDate: string;
  /** Competition end date in YYYY-MM-DD format, on or after startDate. */
  endDate: string;
  /** Human-readable court or venue location. */
  location: string;
}
/** Completed result linking two participating teams to a tournament. */
export interface Game {
  /** Primary key of the completed game. */
  gameID: number;
  /** Foreign key to the winning participating team. */
  winnerTeamID: number;
  /** Foreign key to the losing participating team; must differ from winnerTeamID. */
  loserTeamID: number;
  /** Nonnegative integer score strictly greater than scoreLoser. */
  scoreWinner: number;
  /** Nonnegative integer score of the losing team. */
  scoreLoser: number;
  /** Tournament primary key, or foreign key to the associated tournament in a relationship. */
  tournamentID: number;
  /** ISO timestamp recording when the completed game was played. */
  playedAt: string;
}
/** Unique user/team membership; userID and teamID form its composite key. */
export interface UserTeam {
  /** User primary key, or foreign key to the associated user in a relationship. */
  userID: number;
  /** Team primary key, or foreign key to the associated team in a relationship. */
  teamID: number;
}
/** Unique user/permission assignment; both IDs form its composite key. */
export interface UserPermission {
  /** User primary key, or foreign key to the associated user in a relationship. */
  userID: number;
  /** Permission primary key, or foreign key to a catalog permission in a relationship. */
  permissionID: number;
}
/** Unique team/tournament participation; both IDs form its composite key. */
export interface TeamTournament {
  /** Team primary key, or foreign key to the associated team in a relationship. */
  teamID: number;
  /** Tournament primary key, or foreign key to the associated tournament in a relationship. */
  tournamentID: number;
}
/** Expiring authenticated session; stores a token hash rather than the cookie secret. */
export interface Session {
  /** SHA-256 hash of the opaque cookie token; never the raw token. */
  tokenHash: string;
  /** User primary key, or foreign key to the associated user in a relationship. */
  userID: number;
  /** ISO timestamp after which the session is no longer valid. */
  expiresAt: string;
}
/** Public member identity safe to include in rosters and member directories. */
export type PublicUser = Pick<User, "userID" | "username" | "displayName">;
/** Sanitized signed-in account, including its private email and current permission names. */
export interface AuthUser extends PublicUser {
  /** Unique account email; exposed only in authorized account views. */
  email: string;
  /** Current permission names used for authorization decisions. */
  permissions: PermissionName[];
}
/** Team identity, current roster, and aggregate results for the requested scope. */
export interface TeamView extends Team {
  /** Public identities of the team's current players. */
  members: PublicUser[];
  /** Completed games won within this response's tournament or aggregate scope. */
  wins: number;
  /** Completed games lost within this response's tournament or aggregate scope. */
  losses: number;
  /** Total completed games in scope, equal to wins plus losses. */
  gamesPlayed: number;
  /** Percentage of completed games won, from 0 through 100; zero with no games. */
  winPercentage: number;
}
/** Tournament identity plus participation and completed-game counts. */
export interface TournamentView extends Tournament {
  /** Number of participating teams in the tournament. */
  teamCount: number;
  /** Number of completed games in the tournament. */
  gameCount: number;
}
/** Completed result joined to its winner, loser, and tournament. */
export interface GameView extends Game {
  /** Winning team joined to the completed result. */
  winner: Team;
  /** Losing team joined to the completed result. */
  loser: Team;
  /** Tournament associated with the result or competition inputs. */
  tournament: Tournament;
}
/** Calculated leaderboard row produced by the selected ranking algorithm. */
export interface RankedTeam {
  /** One-based position returned by the selected ranking algorithm. */
  rank: number;
  /** Team associated with this leaderboard row. */
  team: Team;
  /** Public identities of the team's current players. */
  players: PublicUser[];
  /** Completed games won within this response's tournament or aggregate scope. */
  wins: number;
  /** Completed games lost within this response's tournament or aggregate scope. */
  losses: number;
  /** Total completed games in scope, equal to wins plus losses. */
  gamesPlayed: number;
  /** Percentage of completed games won, from 0 through 100; zero with no games. */
  winPercentage: number;
}
/** Suggested court pairing between two different ranked teams. */
export interface Matchup {
  /** One-based suggested court number; does not represent a scheduled reservation. */
  court: number;
  /** First team in the recommended pairing. */
  teamA: RankedTeam;
  /** Second, distinct team in the recommended pairing. */
  teamB: RankedTeam;
  /** Whether this pairing occurs in the algorithm's recent-game window. */
  recentlyPlayed: boolean;
}
/** Generated pairings plus an optional bye for an odd number of teams. */
export interface MatchupResult {
  /** Recommended pairings generated for the selected tournament and round. */
  matchups: Matchup[];
  /** Unpaired team for an odd-sized field, or null when every team is paired. */
  bye: RankedTeam | null;
}
/** Team profile with current statistics, tournament appearances, and complete result history. */
export interface TeamDetails extends TeamView {
  /** Related tournament summaries. */
  tournaments: TournamentView[];
  /** Completed results within the current response's scope. */
  games: GameView[];
}
/** Tournament profile with scoped teams/results and parent/child relationships. */
export interface TournamentDetails extends TournamentView {
  /** Participating teams or team summaries within the current response's scope. */
  teams: TeamView[];
  /** Completed results within the current response's scope. */
  games: GameView[];
  /** Immediate child divisions or stages of the tournament. */
  children: TournamentView[];
  /** Parent tournament, or null for a standalone competition. */
  parent: Tournament | null;
}
/** Club-wide totals displayed by the clubhouse. */
export interface ClubStats {
  /** Number of registered members. */
  members: number;
  /** Number of registered teams. */
  teams: number;
  /** Completed games across all tournaments. */
  games: number;
  /** Tournaments across all semesters and lifecycle states. */
  tournaments: number;
}

/** Public clubhouse response combining stored summaries with calculated standings and pairings. */
export interface HomeData {
  /** Featured active standalone tournament, or null if none is active. */
  active: TournamentView | null;
  /** Related tournament summaries. */
  tournaments: TournamentView[];
  /** Most recent completed results, ordered newest first. */
  recentGames: GameView[];
  /** Calculated leaderboard rows, already in rank order. */
  rankings: RankedTeam[];
  /** Recommended pairings generated for the selected tournament and round. */
  matchups: MatchupResult;
  /** Club-wide counts displayed in the clubhouse. */
  stats: ClubStats;
}
