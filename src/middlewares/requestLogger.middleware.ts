import { NextFunction, Request, Response } from "express";
import { logger } from "../utils/logger";

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.method === "POST") {
    logger.info(
      `method=${req.method} route=${req.originalUrl} body=${JSON.stringify(req.body ?? {})}`
    );
  } else {
    logger.info(`method=${req.method} route=${req.originalUrl}`);
  }
  next();
};
