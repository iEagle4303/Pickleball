import dotenv from "dotenv";
import path from "node:path";
dotenv.config({ path: path.resolve(process.cwd(), "../.env"), quiet: true });
dotenv.config({ quiet: true });
// Resolve from cwd so source and compiled startup share the same data directory.
export const config = {
  port: Number(process.env.PORT || 3001),
  host: process.env.HOST || "127.0.0.1",
  origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  production: process.env.NODE_ENV === "production",
  dataFile:
    process.env.DATA_FILE || path.resolve(process.cwd(), "data/database.json"),
  clientDist: path.resolve(process.cwd(), "../client/dist"),
};
