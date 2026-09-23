const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const envExample = path.join(root, "backend", ".env.example");
const envFile = path.join(root, "backend", ".env");
const uploadsDir = path.join(root, "backend", "uploads");

if (!fs.existsSync(envFile) && fs.existsSync(envExample)) {
  fs.copyFileSync(envExample, envFile);
  console.log("[prepare-local-dev] Created backend/.env from .env.example");
} else if (!fs.existsSync(envFile)) {
  console.warn("[prepare-local-dev] Missing backend/.env — create it before starting the API.");
}

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("[prepare-local-dev] Created backend/uploads");
}
