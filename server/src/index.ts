import { createApp } from "./app.js";
import { config } from "./config.js";
import { JsonFileStore } from "./repositories/json/JsonFileStore.js";
import { JsonUnitOfWork } from "./repositories/json/JsonUnitOfWork.js";
import { createSeedData } from "./seedData.js";
// Storage composition belongs here; services and routes depend only on interfaces.
const store = new JsonFileStore(config.dataFile);
await store.initialize(createSeedData);
const work = new JsonUnitOfWork(store);
const app = createApp(work, {
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
