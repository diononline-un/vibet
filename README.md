# vibet

Local tool for fast design iterations in client meetings. Docker container per project, live view with feedback layer, interactive coding-agent sessions.

**WARNING:** vibet spawns coding agents with file access in project containers. Do not expose the UI to a public network. Client view (later) is read-only and token-gated.

## Status

Phase 0 — spikes. See [PROJECT_STATUS.md](PROJECT_STATUS.md) and the roadmap in the session handoff.

## Layout

- `server/` — Fastify backend (project registry, container control, proxy, agent spawn)
- `ui/` — React/Vite frontend (Monaco, xterm.js)
- `spikes/` — Phase 0 experiments
- `docs/` — plan, decisions, security notes

## License

MIT
