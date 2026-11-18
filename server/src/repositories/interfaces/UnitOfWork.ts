import type { UserQueries, UserRepository } from "./UserRepository.js";
import type { TeamQueries, TeamRepository } from "./TeamRepository.js";
import type {
  TournamentQueries,
  TournamentRepository,
} from "./TournamentRepository.js";
import type { GameQueries, GameRepository } from "./GameRepository.js";
import type {
  PermissionQueries,
  PermissionRepository,
} from "./PermissionRepository.js";
import type { SessionQueries, SessionRepository } from "./SessionRepository.js";

/** Read operations belonging to one consistent snapshot/connection. */
export interface ReadRepositories {
  users: UserQueries;
  teams: TeamQueries;
  tournaments: TournamentQueries;
  games: GameQueries;
  permissions: PermissionQueries;
  sessions: SessionQueries;
}
/** Write-capable repositories scoped to the current transaction. */
export interface WriteRepositories extends ReadRepositories {
  users: UserRepository;
  teams: TeamRepository;
  tournaments: TournamentRepository;
  games: GameRepository;
  permissions: PermissionRepository;
  sessions: SessionRepository;
}
/**
 * Storage-neutral boundary. Callbacks receive repositories, never database tables.
 * A SQL implementation binds repositories to a connection and uses BEGIN/COMMIT/
 * ROLLBACK. A failed transaction must leave all related records unchanged.
 */
export interface UnitOfWork {
  query<T>(
    operation: (repositories: ReadRepositories) => Promise<T>,
  ): Promise<T>;
  transaction<T>(
    operation: (repositories: WriteRepositories) => Promise<T>,
  ): Promise<T>;
}
