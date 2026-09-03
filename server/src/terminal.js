import pty from "@lydell/node-pty";
import { containerName } from "./docker.js";

export function spawnTerminal(id, mode = "shell", sessionId = null) {
  const name = containerName(id);
  let inner;
  if (mode === "opencode") {
    inner = sessionId ? ["opencode", "-s", sessionId] : ["opencode"];
  } else if (mode === "bash") {
    inner = ["bash"];
  } else if (mode === "shell") {
    inner = ["sh"];
  } else {
    throw new Error(`unknown terminal mode: ${mode}`);
  }
  return pty.spawn("docker", ["exec", "-it", name, ...inner], {
    name: "xterm-256color",
    cols: 100,
    rows: 30,
    env: { ...process.env, TERM: "xterm-256color" },
  });
}

export function resizeTerminal(term, cols, rows) {
  try {
    term.resize(Math.max(2, Number(cols) || 100), Math.max(2, Number(rows) || 30));
  } catch {
    // terminal may already be gone
  }
}
