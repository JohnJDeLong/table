import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const serverRoot = path.resolve(currentDir, "../..");
const repoRoot = path.resolve(serverRoot, "..");

dotenv.config({ path: path.join(repoRoot, ".env") });
