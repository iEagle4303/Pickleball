import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import type { AuthService } from "../services/auth/authService.js";
import { endpoint } from "../controllers/leagueController.js";
export function createAuthRoutes(auth: AuthService, production: boolean) {
  const router = Router();
  const cookie = {
    httpOnly: true,
    secure: production,
    sameSite: "lax" as const,
    path: "/api",
    maxAge: 7 * 86400000,
  };
  const authLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      error: { message: "Too many attempts. Please try again in 15 minutes." },
    },
  });
  router.post(
    "/register",
    authLimit,
    endpoint(async (req, res) => {
      const result = await auth.register(req.body);
      res.cookie("league_session", result.token, cookie);
      return result.user;
    }, 201),
  );
  router.post(
    "/login",
    authLimit,
    endpoint(async (req, res) => {
      const result = await auth.login(req.body);
      res.cookie("league_session", result.token, cookie);
      return result.user;
    }),
  );
  router.post(
    "/logout",
    endpoint(async (req, res) => {
      await auth.logout(req.cookies?.league_session);
      res.clearCookie("league_session", {
        path: "/api",
        httpOnly: true,
        sameSite: "lax",
        secure: production,
      });
      return null;
    }),
  );
  router.get(
    "/me",
    endpoint(async (req) => req.user ?? null),
  );
  return router;
}
