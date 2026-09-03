import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocketServer } from "ws";
import { config } from "./config.js";
import * as registry from "./registry.js";
import * as docker from "./docker.js";
import { createProxy, attachProxyHandlers, bindProxyState } from "./proxy.js";
import { spawnTerminal, resizeTerminal } from "./terminal.js";
import { gitInfo } from "./git.js";
import { listSessions } from "./opencode.js";
import { fileTree, readFile, writeFile } from "./files.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const FEEDBACK_JS = fs.readFileSync(path.join(__dirname, "feedback-widget.js"), "utf8");

export async function buildApp(opts = {}) {
  const app = Fastify({ logger: opts.logger ?? false });

  const proxy = createProxy();
  const proxyState = new Map();
  let projectsCache = [];

  async function refreshProjects() {
    projectsCache = await registry.loadProjects();
    const results = await Promise.all(
      projectsCache.map(async (p) => {
        const info = await docker.inspectContainer(p.id);
        let git = { branch: null, commits: [], dirty: false, error: null };
        try {
          git = await gitInfo(p.path);
        } catch {
          // git optional
        }
        return { ...p, container: info, git };
      })
    );
    return results;
  }

  const resolveProxyTarget = (req) => {
    const m = (req.url || "").match(/^\/p\/([^/]+)(\/.*)?$/);
    if (!m) return {};
    const project = projectsCache.find((p) => p.id === m[1]);
    if (!project || !project.hostPort) return { project, target: null };
    return { project, target: `http://127.0.0.1:${project.hostPort}`, enabled: !project.hideAi };
  };

  attachProxyHandlers(app.server, proxy, resolveProxyTarget);

  const wss = new WebSocketServer({ noServer: true });
  wss.on("connection", (ws, req) => {
    const m = (req.url || "").match(/^\/term\/([^/?]+)/);
    if (!m) {
      ws.close();
      return;
    }
    const url = new URL(req.url, "http://localhost");
    const mode = url.searchParams.get("mode") || "shell";
    const sessionId = url.searchParams.get("session") || null;
    let term = null;
    try {
      term = spawnTerminal(m[1], mode, sessionId);
    } catch (err) {
      ws.send(`\r\n[vibet] terminal error: ${err.message}\r\n`);
      ws.close();
      return;
    }
    let buf = "";
    const flush = () => {
      if (buf) {
        ws.send(buf);
        buf = "";
      }
    };
    const flushTimer = setInterval(flush, 16);
    term.onData((d) => {
      buf += d;
    });
    ws.on("message", (msg) => {
      let text;
      try {
        text = JSON.parse(msg.toString());
      } catch {
        text = { type: "input", data: msg.toString() };
      }
      if (text.type === "input" && typeof text.data === "string") term.write(text.data);
      else if (text.type === "resize") resizeTerminal(term, text.cols, text.rows);
    });
    ws.on("close", () => {
      clearInterval(flushTimer);
      flush();
      try {
        term.kill();
      } catch {
        // gone
      }
    });
  });

  app.server.on("upgrade", (req, socket, head) => {
    const pathname = (req.url || "").split("?")[0];
    if (pathname.startsWith("/term/")) {
      wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
    }
  });

  const uiDist = path.join(__dirname, "..", "..", "ui", "dist");
  if (fs.existsSync(uiDist)) {
    app.register(fastifyStatic, { root: uiDist, prefix: "/" });
    app.setNotFoundHandler((req, reply) => {
      if (req.raw.method === "GET" && !req.url.startsWith("/api") && !req.url.startsWith("/p/") && !req.url.startsWith("/term/")) {
        reply.type("text/html").send(fs.readFileSync(path.join(uiDist, "index.html")));
        return;
      }
      reply.code(404).send({ error: "not_found" });
    });
  }

  app.get("/api/projects", async () => refreshProjects());

  app.post("/api/projects", async (req, reply) => {
    const project = await registry.createProject(req.body || {});
    if (!fs.existsSync(project.path)) {
      await registry.deleteProject(project.id);
      reply.code(400).send({ error: "project path does not exist" });
      return;
    }
    const { hostPort } = await docker.ensureContainer(project);
    project.hostPort = hostPort;
    await registry.updateProject(project.id, { hostPort });
    await refreshProjects();
    reply.code(201).send(project);
  });

  app.patch("/api/projects/:id", async (req, reply) => {
    const project = await registry.updateProject(req.params.id, req.body || {});
    await refreshProjects();
    reply.send(project);
  });

  app.delete("/api/projects/:id", async (req) => {
    await docker.removeContainer(req.params.id);
    await registry.deleteProject(req.params.id);
    await refreshProjects();
    return { ok: true };
  });

  app.post("/api/projects/:id/start", async (req, reply) => {
    const project = await registry.getProject(req.params.id);
    if (!project) return reply.code(404).send({ error: "not_found" });
    const { hostPort } = await docker.ensureContainer(project);
    if (hostPort !== project.hostPort) {
      await registry.updateProject(project.id, { hostPort });
    }
    await refreshProjects();
    reply.send({ ok: true, hostPort });
  });

  app.post("/api/projects/:id/stop", async (req) => {
    await docker.stopContainer(req.params.id);
    await refreshProjects();
    return { ok: true };
  });

  app.get("/api/projects/:id/logs", async (req, reply) => {
    const project = await registry.getProject(req.params.id);
    if (!project) return reply.code(404).send({ error: "not_found" });
    return { logs: await docker.containerLogs(project.id, Number(req.query.tail) || 200) };
  });

  app.get("/api/projects/:id/git", async (req, reply) => {
    const project = await registry.getProject(req.params.id);
    if (!project) return reply.code(404).send({ error: "not_found" });
    return gitInfo(project.path);
  });

  app.get("/api/projects/:id/wishes", async (req, reply) => {
    const project = await registry.getProject(req.params.id);
    if (!project) return reply.code(404).send({ error: "not_found" });
    return registry.loadWishes(project.id);
  });

  app.post("/api/projects/:id/wishes", async (req, reply) => {
    const project = await registry.getProject(req.params.id);
    if (!project) return reply.code(404).send({ error: "not_found" });
    const wish = await registry.appendWish(project.id, req.body || {});
    return reply.code(201).send(wish);
  });

  app.delete("/api/projects/:id/wishes/:wishId", async (req) => {
    await registry.deleteWish(req.params.id, req.params.wishId);
    return { ok: true };
  });

  app.get("/api/opencode/sessions", async () => listSessions());

  app.get("/api/projects/:id/files", async (req, reply) => {
    const project = await registry.getProject(req.params.id);
    if (!project) return reply.code(404).send({ error: "not_found" });
    try {
      return fileTree(project.path, String(req.query.path || ""));
    } catch (err) {
      return reply.code(400).send({ error: err.message });
    }
  });

  app.get("/api/projects/:id/file", async (req, reply) => {
    const project = await registry.getProject(req.params.id);
    if (!project) return reply.code(404).send({ error: "not_found" });
    try {
      const content = await readFile(project.path, String(req.query.path || ""));
      return { content };
    } catch (err) {
      return reply.code(400).send({ error: err.message });
    }
  });

  app.put("/api/projects/:id/file", async (req, reply) => {
    const project = await registry.getProject(req.params.id);
    if (!project) return reply.code(404).send({ error: "not_found" });
    const { path: rel, content } = req.body || {};
    try {
      return await writeFile(project.path, String(rel || ""), String(content ?? ""));
    } catch (err) {
      return reply.code(400).send({ error: err.message });
    }
  });

  app.get("/__vibet/feedback.js", (req, reply) => {
    reply.type("application/javascript").send(FEEDBACK_JS);
  });

  app.get("/p/:id", async (req, reply) => reply.redirect(`/p/${req.params.id}/`));

  app.get("/p/:id/*", async (req, reply) => {    const { project, target, enabled } = resolveProxyTarget(req.raw);
    if (!project) return reply.code(404).send({ error: "project_not_found" });
    if (!target) return reply.code(503).send({ error: "project_not_running", port: project.devPort });
    const strip = `/p/${project.id}`;
    req.raw.url = req.raw.url.slice(strip.length) || "/";
    bindProxyState(req.raw, { project, enabled });
    reply.hijack();
    proxy.web(req.raw, reply.raw, { target, changeOrigin: true });
    return reply;
  });

  await refreshProjects();

  return { app, refreshProjects, proxyState };
}
