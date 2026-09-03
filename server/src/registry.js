import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { config } from "./config.js";

export function normalizeProject(raw) {
  const name = String(raw.name || "").trim();
  if (!name) throw new Error("project name required");
  const projectPath = String(raw.path || "").trim();
  if (!projectPath || !path.isAbsolute(projectPath)) throw new Error("project path must be absolute");
  return {
    id: raw.id || `p_${crypto.randomBytes(6).toString("hex")}`,
    name,
    path: projectPath,
    devCommand: String(raw.devCommand || "npm run dev").trim(),
    devPort: Number(raw.devPort || 5173),
    hostPort: Number(raw.hostPort || 0),
    env: raw.env && typeof raw.env === "object" ? raw.env : {},
    hideAi: Boolean(raw.hideAi),
    createdAt: raw.createdAt || new Date().toISOString(),
  };
}

export async function loadProjects() {
  try {
    const raw = await fs.readFile(config.projectsFile, "utf8");
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) throw new Error("projects.json must be an array");
    return list.map(normalizeProject);
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

export async function saveProjects(projects) {
  await fs.mkdir(config.dataDir, { recursive: true });
  const tmp = `${config.projectsFile}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(projects, null, 2));
  await fs.rename(tmp, config.projectsFile);
}

export async function createProject(raw) {
  const projects = await loadProjects();
  const project = normalizeProject(raw);
  if (projects.some((p) => p.name === project.name)) throw new Error("project name already exists");
  if (projects.some((p) => p.path === project.path)) throw new Error("project path already registered");
  projects.push(project);
  await saveProjects(projects);
  return project;
}

export async function updateProject(id, patch) {
  const projects = await loadProjects();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error("project not found");
  const project = normalizeProject({ ...projects[idx], ...patch, id });
  projects[idx] = project;
  await saveProjects(projects);
  return project;
}

export async function deleteProject(id) {
  const projects = await loadProjects();
  const next = projects.filter((p) => p.id !== id);
  await saveProjects(next);
  return next;
}

export async function getProject(id) {
  const projects = await loadProjects();
  return projects.find((p) => p.id === id) || null;
}

export async function wishLogPath(id) {
  const dir = path.join(config.projectsDir, id);
  await fs.mkdir(dir, { recursive: true });
  return path.join(dir, "wishes.json");
}

export async function loadWishes(id) {
  try {
    const raw = await fs.readFile(await wishLogPath(id), "utf8");
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

export async function appendWish(id, wish) {
  const wishes = await loadWishes(id);
  const entry = {
    id: `w_${crypto.randomBytes(5).toString("hex")}`,
    createdAt: new Date().toISOString(),
    ...wish,
  };
  wishes.push(entry);
  await fs.writeFile(await wishLogPath(id), JSON.stringify(wishes, null, 2));
  return entry;
}

export async function deleteWish(id, wishId) {
  const wishes = await loadWishes(id);
  const next = wishes.filter((w) => w.id !== wishId);
  await fs.writeFile(await wishLogPath(id), JSON.stringify(next, null, 2));
  return next;
}
