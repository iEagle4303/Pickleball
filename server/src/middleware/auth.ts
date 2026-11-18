import type { RequestHandler, Request } from "express";
import type { AuthUser, PermissionName } from "../types/entities.js";
import type { AuthService } from "../services/auth/authService.js";
import { HttpError } from "../services/errors.js";
declare global {
  namespace Express {
    /**
     * Express request extended with the sanitized account resolved by authentication middleware.
     */
    interface Request {
      /** Sanitized signed-in account returned alongside the cookie-only token. */
      user?: AuthUser;
    }
  }
}
/**
 * Creates middleware that resolves the session cookie to the current account when valid.
 *
 * @param auth - Authentication service used to resolve session cookies.
 * @returns Express middleware that resolves the request or forwards a failure to the error handler.
 */
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
/**
 * Rejects unauthenticated requests before protected handlers run.
 *
 * @param req - Incoming Express request, including the current account when identified.
 * @param _res - Express response; unused by this guard.
 * @param next - Express continuation used to proceed or forward an authentication/permission error.
 * @returns No result value.
 */
export const requireUser: RequestHandler = (req, _res, next): void =>
  req.user ? next() : next(new HttpError(401, "Sign in to continue."));
/**
 * Creates middleware requiring a signed-in account with the selected permission.
 *
 * @param permission - Permission required for the protected operation.
 * @returns Express middleware that resolves the request or forwards a failure to the error handler.
 */
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
