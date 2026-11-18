import type { JsonDatabase } from "./JsonDatabase.js";
import type { JsonFileStore } from "./JsonFileStore.js";
/**
 * JSON-only context binding operations to a consistent read snapshot or writable transaction.
 */
export class JsonStoreSession {
  /**
   * Creates the JSON-backed JsonStoreSession with its required dependencies.
   *
   * @param file - Atomic JSON file store shared by the feature stores.
   * @param snapshot - Optional already-loaded JSON snapshot for this scope.
   * @param writable - Whether changes are allowed in the supplied snapshot.
   */
  constructor(
    private readonly file: JsonFileStore,
    private readonly snapshot?: JsonDatabase,
    private readonly writable = false,
  ) {}
  /**
   * Reads data through the current snapshot or a fresh read scope.
   *
   * @typeParam T - Result type returned by the supplied operation.
   * @param operation - Operation to run against the scoped data or store; its result is returned.
   * @returns The callback's result, after the operation completes.
   */
  async read<T>(operation: (data: JsonDatabase) => T | Promise<T>): Promise<T> {
    return operation(this.snapshot ?? (await this.file.read()));
  }
  /**
   * Applies a JSON write only within a writable scope or a new transaction.
   *
   * @typeParam T - Result type returned by the supplied operation.
   * @param operation - Operation to run against the scoped data or store; its result is returned.
   * @returns The callback's result, after the operation completes.
   */
  async write<T>(
    operation: (data: JsonDatabase) => T | Promise<T>,
  ): Promise<T> {
    if (!this.snapshot) return this.file.transaction(operation);
    if (!this.writable)
      throw new Error("Cannot write inside a read-only store scope.");
    return operation(this.snapshot);
  }
  /**
   * Runs related reads against the same JSON snapshot.
   *
   * @typeParam T - Result type returned by the supplied operation.
   * @param operation - Operation to run against the scoped data or store; its result is returned.
   * @returns The callback's result, after the operation completes.
   */
  async readScope<T>(
    operation: (session: JsonStoreSession) => Promise<T>,
  ): Promise<T> {
    if (this.snapshot) return operation(this);
    return operation(new JsonStoreSession(this.file, await this.file.read()));
  }
  /**
   * Runs related writes in one atomic scope; rejects upgrades from read-only scopes.
   *
   * @typeParam T - Result type returned by the supplied operation.
   * @param operation - Operation to run against the scoped data or store; its result is returned.
   * @returns The callback's result, after the operation completes.
   */
  transaction<T>(
    operation: (session: JsonStoreSession) => Promise<T>,
  ): Promise<T> {
    if (this.snapshot) {
      if (!this.writable)
        throw new Error(
          "Cannot upgrade a read-only store scope to a transaction.",
        );
      return operation(this);
    }
    return this.file.transaction((data) =>
      operation(new JsonStoreSession(this.file, data, true)),
    );
  }
}
/**
 * Shared JSON feature-store behavior for consistent reads and atomic transactions.
 *
 * @typeParam TStore - Feature-store contract bound to the scope.
 */
export abstract class JsonScopedStore<TStore> {
  /**
   * Creates the JSON-backed JsonScopedStore with its required dependencies.
   *
   * @param session - JSON scope to bind to this feature store.
   */
  constructor(protected readonly session: JsonStoreSession) {}
  /**
   * Creates the same feature-store implementation bound to a supplied JSON scope.
   *
   * @param session - JSON scope to bind to this feature store.
   * @returns The feature-store instance bound to the supplied scope.
   */
  protected abstract bind(session: JsonStoreSession): TStore;
  /**
   * Reads data through the current snapshot or a fresh read scope.
   *
   * @typeParam T - Result type returned by the supplied operation.
   * @param operation - Operation to run against the scoped data or store; its result is returned.
   * @returns The callback's result, after the operation completes.
   */
  read<T>(operation: (store: TStore) => Promise<T>): Promise<T> {
    return this.session.readScope((session) => operation(this.bind(session)));
  }
  /**
   * Runs related writes in one atomic scope; rejects upgrades from read-only scopes.
   *
   * @typeParam T - Result type returned by the supplied operation.
   * @param operation - Operation to run against the scoped data or store; its result is returned.
   * @returns The callback's result, after the operation completes.
   */
  transaction<T>(operation: (store: TStore) => Promise<T>): Promise<T> {
    return this.session.transaction((session) => operation(this.bind(session)));
  }
}
