import { http } from "@/lib/httpClient";
import type { TournamentView } from "@shared/types";
/**
 * Fetches tournament summaries and retains completed tournaments for the archive.
 *
 * @returns An array of tournament summary with participant and completed-game counts.
 * @throws {ApiError} If the API response is unsuccessful or cannot be read.
 */
export const getHistory = async (): Promise<TournamentView[]> =>
  (await http<TournamentView[]>("/tournaments")).filter(
    (tournament) => tournament.status === "completed",
  );
