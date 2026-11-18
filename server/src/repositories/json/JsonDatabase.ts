import type {
  User,
  Team,
  Permission,
  Tournament,
  Game,
  UserTeam,
  UserPermission,
  TeamTournament,
  Session,
} from "../../types/entities.js";
/** On-disk JSON format. This type must not escape the JSON adapter or seed code. */
export interface JsonDatabase {
  users: User[];
  teams: Team[];
  permissions: Permission[];
  tournaments: Tournament[];
  games: Game[];
  userTeams: UserTeam[];
  userPermissions: UserPermission[];
  teamTournaments: TeamTournament[];
  sessions: Session[];
}
