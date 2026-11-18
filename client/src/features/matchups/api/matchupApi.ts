import { http, jsonBody } from "@/lib/httpClient";
import type { MatchupResult, TournamentView } from "@shared/types";
export const matchupApi = {
  get: (id: number) => http<MatchupResult>("/tournaments/" + id + "/matchups"),
  regenerate: (id: number, round: number) =>
    http<MatchupResult>("/tournaments/" + id + "/matchups", {
      method: "POST",
      body: jsonBody({ round }),
    }),
  tournaments: () => http<TournamentView[]>("/tournaments"),
};
