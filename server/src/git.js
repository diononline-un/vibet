import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);

export async function gitInfo(projectPath) {
  const out = { branch: null, commits: [], dirty: false, error: null };
  try {
    const { stdout: branch } = await exec("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
      cwd: projectPath,
      encoding: "utf8",
    });
    out.branch = branch.trim();
  } catch (err) {
    out.error = "not a git repository";
    return out;
  }
  try {
    const { stdout: log } = await exec("git", ["--no-pager", "log", "--oneline", "-10"], {
      cwd: projectPath,
      encoding: "utf8",
    });
    out.commits = log.trim().split("\n").filter(Boolean);
  } catch {
    out.commits = [];
  }
  try {
    const { stdout: status } = await exec("git", ["status", "--porcelain"], {
      cwd: projectPath,
      encoding: "utf8",
    });
    out.dirty = status.trim().length > 0;
  } catch {
    out.dirty = false;
  }
  return out;
}
