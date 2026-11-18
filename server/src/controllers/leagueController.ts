import type { Request, Response, RequestHandler } from "express";
/**
 * Adapts an asynchronous service action to the standard API envelope and error middleware.
 *
 * @param action - Service action whose result will be wrapped in the API data envelope.
 * @param status - HTTP status code for a successful response.
 * @returns Express middleware that resolves the request or forwards a failure to the error handler.
 */
export const endpoint =
  (
    action: (req: Request, res: Response) => Promise<unknown>,
    status = 200,
  ): RequestHandler =>
  async (req, res, next) => {
    try {
      const data = await action(req, res);
      res.status(status).json({ data });
    } catch (error) {
      next(error);
    }
  };
