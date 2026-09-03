---
status: in-development
progress: 40
version: "0.0.1"
tags: [node, fastify, react, vite, docker, opencode, coding-agents, dev-tool, monaco, xterm, claude-code, codex, deepseek-harness]
scope: "Local tool 'vibet' for fast client-meeting design iterations. Docker container per project, live view (proxy + HMR), feedback layer with wish log, interactive coding-agent sessions (opencode first, then Claude Code / Codex / dsh via adapter pattern from nexu-io/open-design), Monaco editor, cost overview from opencode session data, git panel, hide-AI presentation mode. Phase 2: element mapping (data-attrs), asset library, CSS-var panel. Phase 3 (later): token-URL read-only remote client view."
last_updated: "2026-09-03"
next_steps:
  - Phase 2: Kostenübersicht (opencode export/stats), Git-Panel-Polish, Propose/Apply-Modus (opencode-Permissions)
  - Phase 3: Element-Mapping (data-attrs), Asset-Library, Var-Panel
  - Phase 4: Multi-CLI-Adapter (Claude Code, Codex, dsh)
  - Phase 5 (später): Remote-Kunden-View (Token-URL, read-only)
---

# Aktueller Stand

Phase 1 fertig und e2e verifiziert (Vite-App als Test-Projekt): Projekt-Registry
(JSON in `~/.vibet/`), Docker-Lebenszyklus (node:24-slim, opencode-Binary + Config
ro, Data-Dir rw, Projekt auf `/work`), Live-View-Proxy mit HMR-Websocket
(manueller WS-Proxy, Pfad-Strip-Fix: Vite antwortet nicht auf `/p/<id>/`-Paths)
und Feedback-Injection, Terminal (shell/opencode/bash via `docker exec -it` +
xterm.js), Monaco-Editor mit File-Tree, Wish-Log, Hide-AI-Toggle, Git-Panel,
Logs. Backend 9 vitest-Tests grün. Offen: Propose-Modus, Kosten (Phase 2).

## Was steht

- Repo `diononline-un/vibet` (privat), MIT geplant
- Fahrplan: 6 Phasen, lokal (Laptop), UI-Port 4343
- Erster Pilot: `entity-track` (Port 2012)

## Repo

`github.com/diononline-un/vibet` (privat). Lokal `~/Projekte/vibet/`.
