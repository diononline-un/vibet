import { test, expect, beforeAll, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

let dir;
let registry;

beforeAll(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "vibet-test-"));
  process.env.VIBET_DATA_DIR = dir;
  vi.resetModules();
  registry = await import("../src/registry.js");
});

function tmpProjectPath() {
  const p = path.join(dir, `repo-${Math.random().toString(36).slice(2, 8)}`);
  fs.mkdirSync(p, { recursive: true });
  return p;
}

test("createProject normalizes and persists", async () => {
  const project = await registry.createProject({ name: "alpha", path: tmpProjectPath() });
  expect(project.id).toMatch(/^p_/);
  expect(project.devCommand).toBe("npm run dev");
  expect(project.devPort).toBe(5173);
  expect(project.hideAi).toBe(false);
  const loaded = await registry.getProject(project.id);
  expect(loaded.name).toBe("alpha");
});

test("createProject rejects duplicate name and relative path", async () => {
  await expect(registry.createProject({ name: "alpha", path: tmpProjectPath() })).rejects.toThrow(/name/);
  await expect(registry.createProject({ name: "beta", path: "relative/path" })).rejects.toThrow(/absolute/);
});

test("updateProject patches fields and keeps id", async () => {
  const project = await registry.createProject({ name: "gamma", path: tmpProjectPath() });
  const updated = await registry.updateProject(project.id, { hideAi: true, devPort: 3000 });
  expect(updated.id).toBe(project.id);
  expect(updated.hideAi).toBe(true);
  expect(updated.devPort).toBe(3000);
});

test("deleteProject removes entry", async () => {
  const project = await registry.createProject({ name: "delta", path: tmpProjectPath() });
  await registry.deleteProject(project.id);
  expect(await registry.getProject(project.id)).toBeNull();
});

test("wish log append and delete", async () => {
  const project = await registry.createProject({ name: "eps", path: tmpProjectPath() });
  const wish = await registry.appendWish(project.id, { note: "make it red", path: "/x" });
  expect(wish.id).toMatch(/^w_/);
  expect(wish.createdAt).toBeTruthy();
  let wishes = await registry.loadWishes(project.id);
  expect(wishes).toHaveLength(1);
  await registry.appendWish(project.id, { note: "bigger" });
  wishes = await registry.loadWishes(project.id);
  expect(wishes).toHaveLength(2);
  await registry.deleteWish(project.id, wish.id);
  wishes = await registry.loadWishes(project.id);
  expect(wishes.map((w) => w.note)).toEqual(["bigger"]);
});
