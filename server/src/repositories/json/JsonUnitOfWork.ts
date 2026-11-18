import type {
  UnitOfWork,
  ReadRepositories,
  WriteRepositories,
} from "../interfaces/UnitOfWork.js";
import type { JsonDatabase } from "./JsonDatabase.js";
import { JsonFileStore } from "./JsonFileStore.js";
import { JsonUserRepository } from "./JsonUserRepository.js";
import { JsonTeamRepository } from "./JsonTeamRepository.js";
import { JsonTournamentRepository } from "./JsonTournamentRepository.js";
import { JsonGameRepository } from "./JsonGameRepository.js";
import { JsonPermissionRepository } from "./JsonPermissionRepository.js";
import { JsonSessionRepository } from "./JsonSessionRepository.js";
function repositories(data: JsonDatabase): WriteRepositories {
  return {
    users: new JsonUserRepository(data),
    teams: new JsonTeamRepository(data),
    tournaments: new JsonTournamentRepository(data),
    games: new JsonGameRepository(data),
    permissions: new JsonPermissionRepository(data),
    sessions: new JsonSessionRepository(data),
  };
}
/** Only this adapter turns a JSON snapshot into repository implementations. */
export class JsonUnitOfWork implements UnitOfWork {
  constructor(private readonly store: JsonFileStore) {}
  async query<T>(
    operation: (context: ReadRepositories) => Promise<T>,
  ): Promise<T> {
    return operation(repositories(await this.store.read()));
  }
  transaction<T>(
    operation: (context: WriteRepositories) => Promise<T>,
  ): Promise<T> {
    return this.store.transaction((data) => operation(repositories(data)));
  }
}
