import { http } from "@/lib/httpClient";
import type { HomeData } from "@shared/types";
export const getHome = () => http<HomeData>("/home");
