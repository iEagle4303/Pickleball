import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { ZodError } from "zod";
import type { UnitOfWork } from "./repositories/interfaces/UnitOfWork.js";
import { createServices } from "./services/createServices.js";
import { createApi } from "./routes/api.js";
import { HttpError } from "./services/errors.js";
export function createApp(
  work: UnitOfWork,
  options: { origin?: string; production?: boolean; clientDist?: string } = {},
) {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(express.json({ limit: "32kb" }));
  app.use(cookieParser());
  app.use("/api", (req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      const origin = req.get("origin");
      const allowed = options.origin || "http://localhost:5173";
      if (
        origin &&
        origin !== allowed &&
        origin !== req.protocol + "://" + req.get("host")
      )
        return next(new HttpError(403, "Request origin is not allowed."));
      if (req.get("sec-fetch-site") === "cross-site")
        return next(new HttpError(403, "Cross-site requests are not allowed."));
    }
    next();
  });
  app.use("/api", createApi(createServices(work), options.production));
  app.use("/api", (_req, _res, next) =>
    next(new HttpError(404, "API endpoint not found.")),
  );
  if (options.clientDist) {
    app.use(express.static(options.clientDist));
    app.get("/{*path}", (_req, res) =>
      res.sendFile("index.html", { root: options.clientDist }),
    );
  }
  app.use(
    (
      error: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      if (error instanceof ZodError)
        return res.status(400).json({
          error: {
            message: error.issues
              .map(
                (issue) =>
                  (issue.path.length ? issue.path.join(".") + ": " : "") +
                  issue.message,
              )
              .join(" "),
            fields: error.flatten().fieldErrors,
          },
        });
      if (error instanceof HttpError)
        return res
          .status(error.status)
          .json({ error: { message: error.message } });
      if (error instanceof SyntaxError && "body" in error)
        return res
          .status(400)
          .json({ error: { message: "Invalid JSON request." } });
      console.error(error);
      return res
        .status(500)
        .json({ error: { message: "An unexpected server error occurred." } });
    },
  );
  return app;
}
