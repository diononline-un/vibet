import { homedir } from "node:os";
import path from "node:path";

const dataDir = process.env.VIBET_DATA_DIR || path.join(homedir(), ".vibet");
const opencodeBin = process.env.VIBET_OPENCODE_BIN || path.join(homedir(), ".opencode/bin/opencode");
const opencodeConfig = process.env.VIBET_OPENCODE_CONFIG || path.join(homedir(), ".config/opencode");
const opencodeData = process.env.VIBET_OPENCODE_DATA || path.join(homedir(), ".local/share/opencode");

export const config = {
  dataDir,
  projectsFile: path.join(dataDir, "projects.json"),
  projectsDir: path.join(dataDir, "projects"),
  opencodeBin,
  opencodeConfig,
  opencodeData,
  image: process.env.VIBET_IMAGE || "node:24-slim",
  port: Number(process.env.VIBET_PORT || 4343),
};
