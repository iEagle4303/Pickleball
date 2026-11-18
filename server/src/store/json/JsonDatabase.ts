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
/**
 * JSON-only document layout; services must use their dedicated store instead of accessing these arrays.
 */
export interface JsonDatabase {
  /** Internal account records stored in the JSON document. */
  users: User[];
  /** Participating teams or team summaries within the current response's scope. */
  teams: Team[];
  /** Permission catalog records. */
  permissions: Permission[];
  /** Related tournament summaries. */
  tournaments: Tournament[];
  /** Completed results within the current response's scope. */
  games: Game[];
  /** User/team relationship rows. */
  userTeams: UserTeam[];
  /** User/permission relationship rows. */
  userPermissions: UserPermission[];
  /** Team/tournament participation rows. */
  teamTournaments: TeamTournament[];
  /** Hashed, expiring session records. */
  sessions: Session[];
}
