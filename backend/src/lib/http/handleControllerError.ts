import { Response } from "express";
import { AppError } from "../errors/AppError";

export function handleControllerError(
  res: Response,
  error: unknown,
  fallbackMessage: string
): void {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }
  console.error(fallbackMessage, error);
  res.status(500).json({ error: fallbackMessage });
}

export default handleControllerError;
