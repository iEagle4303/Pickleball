import { http } from "@/lib/httpClient";
import type { TournamentView } from "@shared/types";
export const getHistory = async () =>
  (await http<TournamentView[]>("/tournaments")).filter(
    (tournament) => tournament.status === "completed",
  );
