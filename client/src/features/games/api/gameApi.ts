import { http, jsonBody } from "@/lib/httpClient";
import type {
  GameView,
  TournamentView,
  TeamView,
  TournamentDetails,
} from "@shared/types";
export const gameApi = {
  list: (tournamentID?: number, teamID?: number) =>
    http<GameView[]>(
      "/games?" +
        new URLSearchParams({
          ...(tournamentID ? { tournamentID: String(tournamentID) } : {}),
          ...(teamID ? { teamID: String(teamID) } : {}),
        }),
    ),
  tournaments: () => http<TournamentView[]>("/tournaments"),
  teams: () => http<TeamView[]>("/teams"),
  tournament: (id: number) => http<TournamentDetails>("/tournaments/" + id),
  save: (value: unknown, id?: number) =>
    http<GameView>("/games" + (id ? "/" + id : ""), {
      method: id ? "PUT" : "POST",
      body: jsonBody(value),
    }),
  remove: (id: number) => http<null>("/games/" + id, { method: "DELETE" }),
};
