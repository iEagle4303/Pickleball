import { JsonFileStore } from "./store/json/JsonFileStore.js";
import { config } from "./config.js";
import { createSeedData } from "./seedData.js";
const file = new JsonFileStore(config.dataFile);
await file.initialize(createSeedData);
const data = await file.read();
console.log("JSON database ready:", config.dataFile);
console.log(
  data.users.length +
    " users, " +
    data.teams.length +
    " teams, " +
    data.tournaments.length +
    " tournaments, " +
    data.games.length +
    " games. Existing data is preserved.",
);
