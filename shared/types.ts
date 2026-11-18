export const permissionNames = [
  "CREATE_TOURNAMENT",
  "EDIT_TOURNAMENT",
  "MANAGE_TEAMS",
  "ADD_GAME_RESULT",
  "EDIT_GAME_RESULT",
  "DELETE_GAME_RESULT",
  "MANAGE_PERMISSIONS",
] as const;
export type PermissionName = (typeof permissionNames)[number];
export interface User {
  userID: number;
  username: string;
  displayName: string;
  email: string;
  passwordHash: string;
}
export interface Permission {
  permissionID: number;
  description: PermissionName;
}
export interface Team {
  teamID: number;
  name: string;
  color: string;
  createdByUserID: number;
}
export interface Tournament {
  tournamentID: number;
  name: string;
  type: "ladder" | "bracket" | "round-robin";
  parentTournamentID: number | null;
  semester: string;
  status: "active" | "upcoming" | "completed";
  description: string;
  startDate: string;
  endDate: string;
  location: string;
}
export interface Game {
  gameID: number;
  winnerTeamID: number;
  loserTeamID: number;
  scoreWinner: number;
  scoreLoser: number;
  tournamentID: number;
  playedAt: string;
}
export interface UserTeam {
  userID: number;
  teamID: number;
}
export interface UserPermission {
  userID: number;
  permissionID: number;
}
export interface TeamTournament {
  teamID: number;
  tournamentID: number;
}
export interface Session {
  tokenHash: string;
  userID: number;
  expiresAt: string;
}
export type PublicUser = Pick<User, "userID" | "username" | "displayName">;
export interface AuthUser extends PublicUser {
  email: string;
  permissions: PermissionName[];
}
export interface TeamView extends Team {
  members: PublicUser[];
  wins: number;
  losses: number;
  gamesPlayed: number;
  winPercentage: number;
}
export interface TournamentView extends Tournament {
  teamCount: number;
  gameCount: number;
}
export interface GameView extends Game {
  winner: Team;
  loser: Team;
  tournament: Tournament;
}
export interface RankedTeam {
  rank: number;
  team: Team;
  players: PublicUser[];
  wins: number;
  losses: number;
  gamesPlayed: number;
  winPercentage: number;
}
export interface Matchup {
  court: number;
  teamA: RankedTeam;
  teamB: RankedTeam;
  recentlyPlayed: boolean;
}
export interface MatchupResult {
  matchups: Matchup[];
  bye: RankedTeam | null;
}
export interface TeamDetails extends TeamView {
  tournaments: TournamentView[];
  games: GameView[];
}
export interface TournamentDetails extends TournamentView {
  teams: TeamView[];
  games: GameView[];
  children: TournamentView[];
  parent: Tournament | null;
}
export interface HomeData {
  active: TournamentView | null;
  tournaments: TournamentView[];
  recentGames: GameView[];
  rankings: RankedTeam[];
  matchups: MatchupResult;
  stats: { members: number; teams: number; games: number; tournaments: number };
}
