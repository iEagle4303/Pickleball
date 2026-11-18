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
/** Single-writer development store. A lock prevents two server processes from writing concurrently. */
export class JsonFileStore {
  private queue: Promise<unknown> = Promise.resolve();
  constructor(private readonly filename: string) {}
  async initialize(seed: () => Promise<JsonDatabase>) {
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
  async read(): Promise<JsonDatabase> {
    return JSON.parse(await readFile(this.filename, "utf8"));
  }
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
