import type { Request, Response, RequestHandler } from "express";
/** Thin HTTP adapter: validation and business rules belong to services. */
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
