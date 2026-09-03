# vibet

Local tool for fast design iterations in client meetings. Docker container per project, live view with feedback layer, interactive coding-agent sessions.

**WARNING:** vibet spawns coding agents with file access in project containers. Do not expose the UI to a public network. Client view (later) is read-only and token-gated.

## Status

Phase 1 done: project registry, docker lifecycle, live view proxy (HMR + feedback injection), terminal (shell/opencode), Monaco editor, wish log, hide-AI. See [PROJECT_STATUS.md](PROJECT_STATUS.md).

## Quickstart

```bash
# backend (port 4343)
cd server && npm install && npm start

# UI (dev server 5174 with proxy) — or build for backend serving:
cd ui && npm install && npm run dev
# production-ish: npm run build → backend serves ui/dist
```

1. Open http://localhost:5174 (dev) or http://127.0.0.1:4343 (built).
2. "New project" → name, absolute path, dev command (runs in container), dev port.
3. Container starts (node:24-slim, project mounted at /work, opencode binary + config mounted), dev server port published on 127.0.0.1.
4. Open project → Live (proxied, feedback injectable), Terminal (shell / opencode / bash), Wishes, Files, Git, Logs.
5. "Hide AI" toggles feedback layer injection for client meetings.

**WARNING:** vibet spawns coding agents with file access in project containers. Do not expose the UI to a public network. Client view (later) is read-only and token-gated.

## Layout

- `server/` — Fastify backend (project registry, container control, proxy, agent spawn)
- `ui/` — React/Vite frontend (Monaco, xterm.js)
- `spikes/` — Phase 0 experiments
- `docs/` — plan, decisions, security notes

## License

MIT
