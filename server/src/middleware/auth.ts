import type { RequestHandler, Request } from "express";
import type { AuthUser, PermissionName } from "../types/entities.js";
import type { AuthService } from "../services/auth/authService.js";
import { HttpError } from "../services/errors.js";
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
export const identify =
  (auth: AuthService): RequestHandler =>
  async (req, _res, next) => {
    try {
      req.user =
        (await auth.currentUser(req.cookies?.league_session)) || undefined;
      next();
    } catch (error) {
      next(error);
    }
  };
export const requireUser: RequestHandler = (req, _res, next) =>
  req.user ? next() : next(new HttpError(401, "Sign in to continue."));
export const requirePermission =
  (permission: PermissionName): RequestHandler =>
  (req, _res, next) =>
    !req.user
      ? next(new HttpError(401, "Sign in to continue."))
      : req.user.permissions.includes(permission)
        ? next()
        : next(
            new HttpError(403, "You do not have permission for this action."),
          );
