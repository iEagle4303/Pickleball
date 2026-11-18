import { http } from "@/lib/httpClient";
import type { HomeData } from "@shared/types";
/**
 * Fetches the clubhouse summaries, standings, recent games, and suggested pairings.
 *
 * @returns Public clubhouse summaries, recent results, leaderboard, pairings, and totals.
 * @throws {ApiError} If the API response is unsuccessful or cannot be read.
 */
export const getHome = (): Promise<HomeData> => http<HomeData>("/home");
