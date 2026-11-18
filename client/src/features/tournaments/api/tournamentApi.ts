import { http, jsonBody } from "@/lib/httpClient";
import type {
  TournamentView,
  TournamentDetails,
  TeamView,
} from "@shared/types";
export const tournamentApi = {
  list: () => http<TournamentView[]>("/tournaments"),
  get: (id: number) => http<TournamentDetails>("/tournaments/" + id),
  save: (value: unknown, id?: number) =>
    http<TournamentView>("/tournaments" + (id ? "/" + id : ""), {
      method: id ? "PUT" : "POST",
      body: jsonBody(value),
    }),
  remove: (id: number) =>
    http<null>("/tournaments/" + id, { method: "DELETE" }),
  teams: () => http<TeamView[]>("/teams"),
  participants: (id: number, teamIDs: number[]) =>
    http<number[]>("/tournaments/" + id + "/teams", {
      method: "PUT",
      body: jsonBody({ teamIDs }),
    }),
};
