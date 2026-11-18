import dotenv from "dotenv";
import path from "node:path";
dotenv.config({ path: path.resolve(process.cwd(), "../.env"), quiet: true });
dotenv.config({ quiet: true });
// Resolve from cwd so source and compiled startup share the same data directory.
/** Runtime application configuration loaded from environment variables with local-development defaults. */
export interface AppConfig {
  /** API TCP port. */
  port: number;
  /** Interface on which the API listens. */
  host: string;
  /** Exact browser origin allowed by write-request origin checks. */
  origin: string;
  /** Enables HTTPS-only session cookies and production client hosting. */
  production: boolean;
  /** JSON database path used by the current persistence adapter. */
  dataFile: string;
  /** Absolute path of the built Vue client. */
  clientDist: string;
}
/** Runtime configuration resolved from environment settings and local defaults. */
export const config: AppConfig = {
  port: Number(process.env.PORT || 3001),
  host: process.env.HOST || "127.0.0.1",
  origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  production: process.env.NODE_ENV === "production",
  dataFile:
    process.env.DATA_FILE || path.resolve(process.cwd(), "data/database.json"),
  clientDist: path.resolve(process.cwd(), "../client/dist"),
};
