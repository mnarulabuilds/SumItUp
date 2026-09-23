import { Request, Response } from "express";

export function notFoundHandler(_req: Request, res: Response): Response {
  return res.status(404).json({ error: "Resource not found" });
}

export default notFoundHandler;
