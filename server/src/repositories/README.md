# Storage boundary

Application code depends on the interfaces in `interfaces/`. It does not receive a JSON document, mutable table arrays, a database driver, or a file path.

## Repository responsibilities

| Interface            | Queries and writes                                             |
| -------------------- | -------------------------------------------------------------- |
| UserRepository       | User lookup, account creation, profile updates                 |
| TeamRepository       | Teams, tournament team lookup, membership                      |
| TournamentRepository | Tournaments, parent/child lookup, participation                |
| GameRepository       | Filtered results, result writes, team record aggregates        |
| PermissionRepository | Permission catalog and user assignments                        |
| SessionRepository    | Hashed session lookup, expiry, creation, removal               |
| UnitOfWork           | Consistent queries and atomic transactions across repositories |

`UserQueries`, `TeamQueries`, and the other query interfaces expose read operations only. Services use `work.query(...)` for reads and `work.transaction(...)` for changes. Transaction callbacks receive write-capable repositories.

IDs are allocated by adapters. Services pass `Omit<Entity, "entityID">` values when creating records; SQL implementations can return database-generated IDs.

Repository methods return domain entities and plain values. They never return driver rows, SQL result metadata, or the entire store. API view models are assembled by `services/mappers/`.

## JSON implementation

`JsonFileStore` owns file I/O, locking, serialization, and atomic replacement. Its `JsonDatabase` type is private to the JSON persistence layer and seed generator. `JsonUnitOfWork` builds the six entity repositories over a single consistent snapshot.

A write callback changes that snapshot through repository methods. The file is replaced only after the callback resolves. If any validation or write fails, the previous file remains intact.

## Implementing SQL later

1. Implement the six repository interfaces with parameterized queries. For example:
   - `teams.findById(id)` becomes a filtered SELECT.
   - `teams.listMembers(id)` becomes a User/UserTeam join.
   - `games.list({ tournamentID, teamID, limit })` applies WHERE, ORDER BY, and LIMIT in SQL.
   - `games.getTeamRecord(teamID, tournamentID)` uses aggregate counts.
   - `tournaments.replaceTeams(id, ids)` changes only that tournament's join rows.
2. Implement `UnitOfWork`. Bind all repositories in one callback to the same connection. Query callbacks need a consistent read snapshot. Transaction callbacks need BEGIN, COMMIT, and ROLLBACK and must serialize conflicting writes, using appropriate isolation or row locks.
3. Enforce primary/foreign keys, case-insensitive uniqueness for usernames/emails/team names, and unique composite relationship keys. Map known constraint conflicts to the existing HTTP conflict errors. Preserve doubles capacity, hierarchy checks, and the last permission administrator under concurrent writes.
4. Select the SQL unit of work in `server/src/index.ts` and supply it to `createApp`. Run schema migration and data import separately from app startup.

No services, route handlers, ranking algorithms, or frontend API modules need to load SQL table snapshots or change their public contracts. JSON initialization/seeding is adapter-specific startup work; SQL startup should run its own adapter setup.

`json/` is the sole current adapter. No SQL package or external database connection is included.
