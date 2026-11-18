import { http, jsonBody } from "@/lib/httpClient";
import type { TeamView, TeamDetails, PublicUser } from "@shared/types";
export const teamApi = {
  list: () => http<TeamView[]>("/teams"),
  get: (id: number) => http<TeamDetails>("/teams/" + id),
  save: (value: unknown, id?: number) =>
    http<TeamView>("/teams" + (id ? "/" + id : ""), {
      method: id ? "PUT" : "POST",
      body: jsonBody(value),
    }),
  users: () => http<PublicUser[]>("/users"),
  join: (id: number, userID: number) =>
    http<TeamView>("/teams/" + id + "/members", {
      method: "POST",
      body: jsonBody({ userID }),
    }),
  leave: (id: number, userID: number) =>
    http<TeamView>("/teams/" + id + "/members/" + userID, { method: "DELETE" }),
};
