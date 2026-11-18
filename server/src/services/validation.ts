import { z } from "zod";
const name = z.string().trim().min(2).max(80);
const id = z.number().int().positive();
const date = z.iso.date();
/** Registration rules for normalized unique identity fields and a password of at least 12 characters. */
export const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_]+$/, "Use letters, numbers, and underscores."),
  displayName: name,
  email: z.email().trim().toLowerCase().max(254),
  password: z.string().min(12, "Use at least 12 characters.").max(128),
});
/** Login credential rules; password verification is performed by AuthService. */
export const loginSchema = z.object({
  username: z.string().trim().toLowerCase().min(1).max(254),
  password: z.string().min(1).max(128),
});
/** Editable profile-field validation and email normalization. */
export const profileSchema = z.object({
  displayName: name,
  email: z.email().trim().toLowerCase().max(254),
});
/** Team name and supported accent-color validation. */
export const teamSchema = z.object({
  name,
  color: z
    .enum(["lime", "blue", "orange", "purple", "teal", "rose"])
    .default("lime"),
});
/** Tournament field validation, including semester, format, status, and date ordering. */
export const tournamentSchema = z
  .object({
    name,
    type: z.enum(["ladder", "bracket", "round-robin"]),
    parentTournamentID: id.nullable().default(null),
    semester: z.string().trim().min(4).max(40),
    status: z.enum(["active", "upcoming", "completed"]),
    description: z.string().trim().max(2000).default(""),
    startDate: date,
    endDate: date,
    location: z.string().trim().min(2).max(120),
  })
  .refine((value) => value.endDate >= value.startDate, {
    message: "End date must be on or after start date.",
    path: ["endDate"],
  });
/** Completed-result validation requiring different teams, integer scores, and the winning score ahead. */
export const gameSchema = z
  .object({
    winnerTeamID: id,
    loserTeamID: id,
    scoreWinner: z.number().int().min(0).max(999),
    scoreLoser: z.number().int().min(0).max(999),
    tournamentID: id,
    playedAt: z.iso.datetime(),
  })
  .refine((value) => value.winnerTeamID !== value.loserTeamID, {
    message: "Choose two different teams.",
    path: ["loserTeamID"],
  })
  .refine((value) => value.scoreWinner > value.scoreLoser, {
    message: "Winning score must exceed losing score.",
    path: ["scoreWinner"],
  });
/** Validation for one positive user ID to add to a team. */
export const membershipSchema = z.object({ userID: id });
/** Validation for a unique, bounded list of tournament participant IDs. */
export const participationSchema = z.object({
  teamIDs: z
    .array(id)
    .max(200)
    .refine(
      (ids) => new Set(ids).size === ids.length,
      "Duplicate teams are not allowed.",
    ),
});
/** Validation for unique positive permission IDs assigned to a user. */
export const permissionsSchema = z.object({
  permissionIDs: z
    .array(id)
    .refine(
      (ids) => new Set(ids).size === ids.length,
      "Duplicate permissions are not allowed.",
    ),
});
/** Nonnegative bounded round number controlling deterministic pairing regeneration. */
export const roundSchema = z.coerce.number().int().min(0).max(10000).default(0);
/**
 * Parses a positive integer identifier and rejects invalid route or query values.
 *
 * @param value - Value to validate or transform.
 * @returns The validated positive integer ID.
 */
export function parseID(value: unknown): number {
  return z.coerce.number().int().positive().parse(value);
}
