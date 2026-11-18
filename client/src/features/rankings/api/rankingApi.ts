import { http } from "@/lib/httpClient";
import type { RankedTeam, TournamentView } from "@shared/types";
export const rankingApi = {
  list: (id: number) => http<RankedTeam[]>("/tournaments/" + id + "/rankings"),
  tournaments: () => http<TournamentView[]>("/tournaments"),
};
