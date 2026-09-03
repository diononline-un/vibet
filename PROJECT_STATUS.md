---
status: in-development
progress: 15
version: "0.0.1"
tags: [node, fastify, react, vite, docker, opencode, coding-agents, dev-tool, monaco, xterm, claude-code, codex, deepseek-harness]
scope: "Local tool 'vibet' for fast client-meeting design iterations. Docker container per project, live view (proxy + HMR), feedback layer with wish log, interactive coding-agent sessions (opencode first, then Claude Code / Codex / dsh via adapter pattern from nexu-io/open-design), Monaco editor, cost overview from opencode session data, git panel, hide-AI presentation mode. Phase 2: element mapping (data-attrs), asset library, CSS-var panel. Phase 3 (later): token-URL read-only remote client view."
last_updated: "2026-09-03"
next_steps:
  - Phase 1: Scaffold Fastify-Backend + React-UI (Monaco, xterm.js)
  - Phase 1: Overview-Karten, Container-Lebenszyklus, Live-View-Proxy, Terminal-Sideview
  - Phase 1: Feedback-Layer (Inject), Hide-AI, Wunsch-Log
  - Phase 2: Kostenübersicht (opencode export), Git-Panel, Propose/Apply
  - Phase 3: Element-Mapping, Asset-Library, Var-Panel
  - Phase 4: Multi-CLI-Adapter (Claude Code, Codex, dsh)
---

# Aktueller Stand

Phase 0 fertig. Alle 5 Spikes grün, Entscheidungen gefroren
(`spikes/PHASE0-RESULTS.md`). Basis: node:24-slim-Container, opencode-Binary +
Config ro gemountet, Data-Dir rw, `@lydell/node-pty`, docker CLI,
`http-proxy` mit HTML-Inject + HMR-WS, Git hostseitig. Als nächstes Phase 1
(Fastify-Backend + React-UI).

## Was steht

- Repo `diononline-un/vibet` (privat), MIT geplant
- Fahrplan: 6 Phasen, lokal (Laptop), UI-Port 4343
- Erster Pilot: `entity-track` (Port 2012)

## Repo

`github.com/diononline-un/vibet` (privat). Lokal `~/Projekte/vibet/`.
