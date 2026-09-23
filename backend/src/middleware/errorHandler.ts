import { Request, Response, NextFunction } from "express";
import { AppError } from "../lib/errors/AppError";

const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  console.error(err.stack || err);
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal Server Error"
      : err.message || "Internal Server Error";

  return res.status(500).json({ error: message });
};

export default errorHandler;
