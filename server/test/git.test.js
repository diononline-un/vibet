import { test, expect, beforeAll } from "vitest";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { gitInfo } from "../src/git.js";

let dir;

beforeAll(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "vibet-git-"));
  execFileSync("git", ["init", "-q", dir]);
  execFileSync("git", ["-C", dir, "config", "user.email", "t@example.com"]);
  execFileSync("git", ["-C", dir, "config", "user.name", "t"]);
  fs.writeFileSync(path.join(dir, "a.txt"), "one");
  execFileSync("git", ["-C", dir, "add", "a.txt"]);
  execFileSync("git", ["-C", dir, "commit", "-qm", "first"]);
});

test("gitInfo reads branch and commits", async () => {
  const info = await gitInfo(dir);
  expect(info.branch).toBeTruthy();
  expect(info.commits[0]).toContain("first");
  expect(info.dirty).toBe(false);
});

test("gitInfo marks dirty and reports non-repo", async () => {
  fs.writeFileSync(path.join(dir, "a.txt"), "changed");
  const info = await gitInfo(dir);
  expect(info.dirty).toBe(true);
  const missing = await gitInfo(path.join(dir, "nope"));
  expect(missing.error).toBe("not a git repository");
});
