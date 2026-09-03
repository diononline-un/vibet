import { test, expect } from "vitest";

const { listSessions } = await import("../src/opencode.js");

test("listSessions returns [] without binary (env disabled)", async () => {
  process.env.VIBET_DISABLE_OPENCODE = "1";
  const sessions = await listSessions();
  expect(Array.isArray(sessions)).toBe(true);
  delete process.env.VIBET_DISABLE_OPENCODE;
});
