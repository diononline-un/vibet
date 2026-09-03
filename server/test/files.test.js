import { test, expect } from "vitest";
import { safeResolve } from "../src/files.js";

test("safeResolve blocks traversal", () => {
  expect(() => safeResolve("/a/b", "../x")).toThrow(/outside/);
  expect(() => safeResolve("/a/b", "c/../../x")).toThrow(/outside/);
  expect(safeResolve("/a/b", "c/d")).toBe("/a/b/c/d");
  expect(safeResolve("/a/b", "")).toBe("/a/b");
});
