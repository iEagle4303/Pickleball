import { JsonFileStore } from "./repositories/json/JsonFileStore.js";
import { JsonUnitOfWork } from "./repositories/json/JsonUnitOfWork.js";
import { config } from "./config.js";
import { createSeedData } from "./seedData.js";
const store = new JsonFileStore(config.dataFile);
await store.initialize(createSeedData);
const work = new JsonUnitOfWork(store);
const [users, teams, tournaments, games] = await work.query((repositories) =>
  Promise.all([
    repositories.users.count(),
    repositories.teams.count(),
    repositories.tournaments.count(),
    repositories.games.count(),
  ]),
);
console.log("JSON database ready:", config.dataFile);
console.log(
  users +
    " users, " +
    teams +
    " teams, " +
    tournaments +
    " tournaments, " +
    games +
    " games. Existing data is preserved.",
);
