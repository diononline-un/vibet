import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { config } from "./config.js";

const exec = promisify(execFile);

export async function listSessions() {
  if (!process.env.VIBET_DISABLE_OPENCODE) {
    try {
      const { stdout } = await exec(config.opencodeBin, ["session", "list"], {
        encoding: "utf8",
        maxBuffer: 2 * 1024 * 1024,
      });
      return parseSessionTable(stdout);
    } catch {
      // binary missing or broken — return empty list, UI shows hint
    }
  }
  return [];
}

function parseSessionTable(output) {
  const lines = output.split("\n");
  const sessions = [];
  for (const line of lines) {
    const m = line.match(/^(ses_[A-Za-z0-9]+)\s+(.+)$/);
    if (!m) continue;
    const rest = m[2].trim();
    const parts = rest.split(/\s{2,}/);
    const title = parts.length > 1 ? parts.slice(0, -1).join(" ") : rest;
    sessions.push({ id: m[1], title, updated: parts[parts.length - 1] || "" });
  }
  return sessions;
}

export async function sessionExport(sessionId) {
  try {
    const { stdout } = await exec(config.opencodeBin, ["export", sessionId], {
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
    });
    const data = JSON.parse(stdout);
    return {
      id: data.info?.id,
      title: data.info?.title,
      directory: data.info?.directory,
      cost: data.info?.cost,
      tokens: data.info?.tokens,
    };
  } catch {
    return null;
  }
}
