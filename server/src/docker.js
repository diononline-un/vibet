import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import { config } from "./config.js";

const exec = promisify(execFile);

export const containerName = (id) => `vibet-${id}`;

export async function docker(args, opts = {}) {
  return exec("docker", args, { maxBuffer: 4 * 1024 * 1024, ...opts });
}

function buildRunArgs(project) {
  const name = containerName(project.id);
  const args = ["run", "-d", "--name", name, "--restart", "no"];
  const mounts = [
    { src: config.opencodeBin, dst: "/usr/local/bin/opencode", ro: true },
    { src: config.opencodeConfig, dst: "/root/.config/opencode", ro: true },
    { src: config.opencodeData, dst: "/root/.local/share/opencode", ro: false },
    { src: project.path, dst: "/work", ro: false },
  ];
  for (const m of mounts) {
    if (!fs.existsSync(m.src)) continue;
    args.push("-v", `${m.src}:${m.dst}${m.ro ? ":ro" : ""}`);
  }
  for (const [k, v] of Object.entries(project.env || {})) args.push("-e", `${k}=${v}`);
  args.push("-w", "/work");
  if (project.devPort) args.push("-p", `127.0.0.1::${project.devPort}`);
  args.push(config.image, "sh", "-c", `cd /work && ${project.devCommand}`);
  return args;
}

export async function ensureContainer(project) {
  const name = containerName(project.id);
  const { stdout } = await docker(["ps", "-a", "--format", "{{.Names}}"], { encoding: "utf8" });
  const exists = stdout.split("\n").includes(name);
  if (!exists) {
    await docker(buildRunArgs(project));
  }
  const info = await inspectContainer(project.id);
  if (!info.running) await docker(["start", name]);
  return { name, hostPort: info.hostPort };
}

export async function inspectContainer(id) {
  const name = containerName(id);
  try {
    const { stdout } = await docker(["inspect", name, "--format", "{{json .}}"], { encoding: "utf8" });
    const raw = JSON.parse(stdout);
    let hostPort = 0;
    for (const [containerPort, bindings] of Object.entries(raw.NetworkSettings?.Ports || {})) {
      const first = Array.isArray(bindings) ? bindings[0] : null;
      if (first?.HostPort) hostPort = Number(first.HostPort);
    }
    return {
      exists: true,
      running: raw.State?.Running ?? false,
      status: raw.State?.Status || "unknown",
      exitCode: raw.State?.ExitCode ?? null,
      hostPort,
      startedAt: raw.State?.StartedAt || null,
    };
  } catch (err) {
    if (err.code === 1 || (err.stderr || "").includes("No such object")) {
      return { exists: false, running: false, status: "missing", hostPort: 0 };
    }
    throw err;
  }
}

export async function stopContainer(id) {
  const name = containerName(id);
  const info = await inspectContainer(id);
  if (info.exists) await docker(["stop", name]);
  return { running: false };
}

export async function removeContainer(id) {
  const name = containerName(id);
  const info = await inspectContainer(id);
  if (info.exists) {
    if (info.running) await docker(["stop", name]);
    await docker(["rm", name]);
  }
  return { exists: false };
}

export async function containerLogs(id, tail = 200) {
  const name = containerName(id);
  try {
    const { stdout } = await docker(["logs", "--tail", String(tail), name], { encoding: "utf8" });
    return stdout;
  } catch {
    return "";
  }
}
