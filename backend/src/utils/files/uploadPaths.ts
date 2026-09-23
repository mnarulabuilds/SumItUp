import fs from "fs";
import path from "path";
import { AppError } from "../../lib/errors/AppError";

export const UPLOADS_ROOT = process.env.UPLOAD_PATH
  ? path.resolve(process.env.UPLOAD_PATH)
  : path.resolve(__dirname, "../../../uploads");

/** Resolves a user-provided filename to a path under uploads (no directory traversal). */
export function resolveUploadPath(filename: string): string {
  if (!filename || typeof filename !== "string") {
    throw new AppError("File reference is required", 400);
  }

  const base = path.basename(filename);
  const resolved = path.resolve(UPLOADS_ROOT, base);

  if (!resolved.startsWith(UPLOADS_ROOT + path.sep) && resolved !== UPLOADS_ROOT) {
    throw new AppError("Invalid file path", 400);
  }

  return resolved;
}

export function assertUploadExists(filePath: string, notFoundMessage: string): void {
  if (!fs.existsSync(filePath)) {
    throw new AppError(notFoundMessage, 404);
  }
}

export default resolveUploadPath;
