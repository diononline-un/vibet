import fs from "node:fs/promises";
import path from "node:path";

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", ".next", "build", ".vite"]);
const MAX_FILE = 512 * 1024;

export function safeResolve(projectPath, rel) {
  const resolved = path.resolve(projectPath, rel || ".");
  if (resolved !== projectPath && !resolved.startsWith(projectPath + path.sep)) {
    throw new Error("path outside project");
  }
  return resolved;
}

export async function fileTree(projectPath, rel = "") {
  const root = safeResolve(projectPath, rel);
  const entries = await fs.readdir(root, { withFileTypes: true });
  const items = [];
  for (const entry of entries) {
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
    const childRel = rel ? `${rel}/${entry.name}` : entry.name;
    items.push({ name: entry.name, path: childRel, dir: entry.isDirectory() });
  }
  items.sort((a, b) => (a.dir === b.dir ? a.name.localeCompare(b.name) : a.dir ? -1 : 1));
  return items;
}

export async function readFile(projectPath, rel) {
  const resolved = safeResolve(projectPath, rel);
  const stat = await fs.stat(resolved);
  if (stat.size > MAX_FILE) throw new Error("file too large");
  return fs.readFile(resolved, "utf8");
}

export async function writeFile(projectPath, rel, content) {
  const resolved = safeResolve(projectPath, rel);
  await fs.writeFile(resolved, content, "utf8");
  return { ok: true };
}
