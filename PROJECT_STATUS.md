---
status: in-development
progress: 5
version: "0.0.1"
tags: [node, fastify, react, vite, docker, opencode, coding-agents, dev-tool, monaco, xterm, claude-code, codex, deepseek-harness]
scope: "Local tool 'vibet' for fast client-meeting design iterations. Docker container per project, live view (proxy + HMR), feedback layer with wish log, interactive coding-agent sessions (opencode first, then Claude Code / Codex / dsh via adapter pattern from nexu-io/open-design), Monaco editor, cost overview from opencode session data, git panel, hide-AI presentation mode. Phase 2: element mapping (data-attrs), asset library, CSS-var panel. Phase 3 (later): token-URL read-only remote client view."
last_updated: "2026-09-03"
next_steps:
  - Phase 0: Spikes A–E (opencode-PTY im Container, opencode-Data-Dir/Kosten, dockerode-vs-CLI, Proxy+Inject, Git)
  - Phase 1: Overview-Karten, Container-Lebenszyklus, Live-View, Terminal-Sideview, Feedback-Layer, Hide-AI, Monaco
  - Phase 2: Agent-Profil, Kostenübersicht, Git-Panel, Propose/Apply
  - Phase 3: Element-Mapping, Asset-Library, Var-Panel
  - Phase 4: Multi-CLI-Adapter
---

# Aktueller Stand

Phase 0. Repo angelegt, Plan steht im Fahrplan (Session vom 2026-09-03).
Spikes entscheiden die Tech-Basis, bevor Phase 1 beginnt.

## Was steht

- Repo `diononline-un/vibet` (privat), MIT geplant
- Fahrplan: 6 Phasen, lokal (Laptop), UI-Port 4343
- Erster Pilot: `entity-track` (Port 2012)

## Repo

`github.com/diononline-un/vibet` (privat). Lokal `~/Projekte/vibet/`.
