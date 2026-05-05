import { NextFunction, Request, Response } from "express";
import { logger } from "../utils/logger";
import { formatForLog } from "../utils/log-format";

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startedAt = Date.now();
  let responseBody: unknown;

  const originalJson = res.json.bind(res);
  res.json = ((body: unknown) => {
    responseBody = body;
    return originalJson(body);
  }) as Response["json"];

  const originalSend = res.send.bind(res);
  res.send = ((body: unknown) => {
    if (responseBody === undefined) {
      responseBody = body;
    }

    return originalSend(body);
  }) as Response["send"];

  res.on("finish", () => {
    if (res.statusCode >= 400) {
      return;
    }

    logger.info(
      {
        method: req.method,
        route: req.originalUrl,
        body: formatForLog(req.body ?? {}),
        response: formatForLog(responseBody),
        statusCode: res.statusCode,
        durationMs: Date.now() - startedAt,
      },
      "Request completed"
    );
  });

  next();
};
