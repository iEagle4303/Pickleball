import { createApp } from "./app.js";
import { config } from "./config.js";
import { JsonFileStore } from "./store/json/JsonFileStore.js";
import { createJsonStores } from "./store/createStores.js";
import { createSeedData } from "./seedData.js";
const file = new JsonFileStore(config.dataFile);
await file.initialize(createSeedData);
// Replace this factory with SQL stores when a SQL backend is introduced.
const stores = createJsonStores(file);
const app = createApp(stores, {
  origin: config.origin,
  production: config.production,
  clientDist:
    config.production || process.argv.includes("--serve-client")
      ? config.clientDist
      : undefined,
});
const server = app.listen(config.port, config.host, () =>
  console.log(
    "Pickleball API listening at http://" + config.host + ":" + config.port,
  ),
);
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
