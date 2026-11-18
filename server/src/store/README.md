# Per-service stores

Every service has one matching file in this folder:

| Service           | Store              |
| ----------------- | ------------------ |
| AuthService       | authStore.ts       |
| HomeService       | homeStore.ts       |
| TournamentService | tournamentStore.ts |
| TeamService       | teamStore.ts       |
| GameService       | gameStore.ts       |
| UserService       | userStore.ts       |
| PermissionService | permissionStore.ts |
| RankingService    | rankingStore.ts    |
| MatchupService    | matchupStore.ts    |

Each file declares its public store interface and its current JSON implementation. Services depend on their own store interface. Store methods supply records, joined view models, or calculation inputs; validation, authorization, ranking rules, and matchup algorithms stay in services.

## Parameters

Pass identifiers and simple values directly:

```ts
teamStore.getTeam(teamID);
teamStore.addMember(teamID, userID);
teamStore.updateTeam(teamID, name, color);
gameStore.list(tournamentID, teamID);
gameStore.removeGame(gameID);
userStore.updateProfile(userID, displayName, email);
userStore.replacePermissions(userID, permissionIDs);
```

Do not wrap IDs in filter objects such as `{ tournamentID, teamID }`.

Objects remain appropriate for a complete record with many related fields. For example, `createGame(input: GameInput)`, `updateGame(gameID, input: GameInput)`, and `createTournament(input: TournamentInput)` accept full record payloads. Store collections and scoped store dependencies are also meaningful objects, rather than wrappers around IDs.

## Current JSON storage

`createJsonStores(file)` creates all nine stores and is selected in `server/src/index.ts`. The store functions read and write JSON through shared helpers under `json/`:

- `JsonFileStore` owns file locking, queued writes, and atomic file replacement.
- `JsonStoreSession` binds reads/writes to a snapshot and prevents writes in read-only scopes.
- `views.ts` performs JSON joins and view-model projection.
- `identity.ts` allocates IDs for JSON records only.
- `JsonDatabase.ts` describes the on-disk document and is never exposed to services.

A store's `read(callback)` keeps related reads consistent. Its `transaction(callback)` gives the callback a scoped instance of that same feature store. Related validations and writes are atomic. A thrown error leaves the saved JSON unchanged. Read-only scopes cannot be upgraded into transactions.

For example, `TeamService.create` checks the creator and team name, creates the team, and adds the first member inside one team-store transaction.

RankingStore and MatchupStore return the participating teams, their members, and completed games from one consistent snapshot. HomeStore returns one consistent clubhouse snapshot. The services calculate rankings and pairings from that data; stores never call the algorithms.

## Replacing JSON with SQL

Implement the same per-service store interfaces using parameterized SQL queries, joins, and aggregate queries. You can replace the current JSON method bodies or add SQL implementations and a `createSqlStores(connectionPool): Stores` factory.

For `read`, bind the scoped store to a consistent read connection/transaction. For `transaction`, bind it to one SQL transaction and commit only when the callback completes; roll back on error. Preserve conflicting-write isolation, doubles roster capacity, hierarchy validation, and the last permission administrator.

SQL adapters should allocate IDs in the database and enforce foreign keys, case-insensitive uniqueness, and composite relationship uniqueness. Convert known constraint conflicts to the existing HTTP conflict errors.

Select the SQL store factory at startup instead of `createJsonStores`. Services, route URLs, and frontend APIs can remain unchanged. SQL implementations need not read or rewrite all tables: each store method can run only its required query.

JSON seeding is adapter-specific startup work. Use a separate schema migration/import step for SQL. No SQL package or external database connection is included yet.
