import {
  readFile,
  writeFile,
  mkdir,
  rename,
  open,
  unlink,
} from "node:fs/promises";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import type { JsonDatabase } from "./JsonDatabase.js";
/**
 * Serializes development JSON writes using a lock and atomic file replacement.
 */
export class JsonFileStore {
  private queue: Promise<unknown> = Promise.resolve();
  /**
   * Creates the JSON-backed JsonFileStore with its required dependencies.
   *
   * @param filename - Absolute or resolved path of the JSON database file.
   */
  constructor(private readonly filename: string) {}
  /**
   * Creates a missing JSON store without overwriting existing data.
   *
   * @param seed - Asynchronous seed factory invoked only when the JSON database file is missing.
   * @returns Resolves when the operation completes; no result value is returned.
   * @throws {Error} If JSON persistence or referenced-record integrity checks fail.
   */
  async initialize(seed: () => Promise<JsonDatabase>): Promise<void> {
    await mkdir(dirname(this.filename), { recursive: true });
    try {
      await this.read();
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      const data = await seed();
      try {
        await writeFile(this.filename, JSON.stringify(data, null, 2), {
          flag: "wx",
        });
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      }
    }
  }
  /**
   * Reads a fresh JSON database document from disk.
   *
   * @returns Fresh parsed JSON document containing all development tables.
   * @throws {Error} If JSON persistence or referenced-record integrity checks fail.
   */
  async read(): Promise<JsonDatabase> {
    return JSON.parse(await readFile(this.filename, "utf8"));
  }
  /**
   * Queues and atomically commits a JSON transaction, preserving the prior file on failure.
   *
   * @typeParam T - Result type returned by the supplied operation.
   * @param operation - Operation to run against the scoped data or store; its result is returned.
   * @returns The callback's result, after the operation completes.
   * @throws {Error} If JSON persistence or referenced-record integrity checks fail.
   */
  transaction<T>(
    operation: (data: JsonDatabase) => T | Promise<T>,
  ): Promise<T> {
    const task = this.queue.then(async () => {
      const lock = await open(this.filename + ".lock", "wx").catch(() => {
        throw new Error(
          "JSON store is locked by another process. Run only one API server.",
        );
      });
      const temporary = this.filename + "." + randomUUID() + ".tmp";
      try {
        const data = await this.read();
        const result = await operation(data);
        const handle = await open(temporary, "wx");
        try {
          await handle.writeFile(JSON.stringify(data, null, 2));
          await handle.sync();
        } finally {
          await handle.close();
        }
        await rename(temporary, this.filename);
        return structuredClone(result);
      } finally {
        await unlink(temporary).catch(() => {});
        await lock.close();
        await unlink(this.filename + ".lock");
      }
    });
    this.queue = task.catch(() => {});
    return task;
  }
}
