# Handoff — vibet, Phase 0 → Phase 1

Stand: 2026-09-03, Ende Session "vibet Planung + Phase 0".

## Was fertig ist

- Repo `diononline-un/vibet` (privat), PR #1 gemerged, main aktuell.
- Phase 0 komplett, alle Entscheidungen in `spikes/PHASE0-RESULTS.md`.
- Fahrplan 6 Phasen in `PROJECT_STATUS.md` + Changelog-Eintrag.

## Gefrorene Entscheidungen (Details: spikes/PHASE0-RESULTS.md)

| Thema | Entscheidung |
|---|---|
| PTY | `@lydell/node-pty` (prebuilt; `node-pty` scheitert an npm-Build-Block) |
| Agent-TUI | `docker exec -it <ctr> opencode [-s <id>]`, xterm.js |
| Container | `node:24-slim`, opencode-Binary ro gemountet (`~/.opencode/bin/opencode` → `/usr/local/bin/opencode`), Config ro (`~/.config/opencode`), Data-Dir rw (`~/.local/share/opencode`) |
| Kosten | vibet-Backend hostseitig: `opencode export <id>` (JSON: `info.cost`, `info.tokens`, `info.directory`, `info.title`) — **nie** durch `docker exec`-Stdout-Pipe (deterministischer Truncation-Bug, Exit 0, ~96KB-Chunks) |
| Docker | CLI via child_process (`ps --format json`, `inspect`), kein dockerode |
| Live-View | `http-proxy` + `selfHandleResponse`, HTML-Inject vor `</body>`, `proxy.ws` für HMR (Subprotocol `vite-hmr` erforderlich) |
| Git | hostseitig auf Projekt-Pfad (`git -C <pfad>`) |
| Ports | vibet-UI 4343, Projekt-Ports dynamisch ab 5500 auf 127.0.0.1 |

## Prototypen im Repo

- `spikes/pty/index.js` — node-pty-Pattern (spawn, onData, resize)
- `spikes/proxy-proto/proxy.js` — kompletter Proxy + Inject + WS-Passthrough (läuft: `node proxy.js` gegen Port 5517, Vite-App in `/tmp/opencode/spike-d/app`)

## Phase 1 — nächste Schritte

1. **Scaffold:** `server/` (Fastify) + `ui/` (Vite + React, Monaco via `@monaco-editor/react`, xterm.js via `@xterm/xterm` + `@xterm/addon-fit`). Tests: vitest (Muster: entity-track).
2. **Projekt-Registry:** JSON-Datei `~/.vibet/projects.json` oder SQLite? (Entscheidung offen, einfacher Start: JSON + chokidar). Projekt: name, path, devBefehl, port.
3. **Container-Lebenszyklus:** create/start/stop/rm/logs/health via docker CLI, Image `node:24-slim`, Mounts wie oben + Projekt rw.
4. **Live-View:** Proxy aus `spikes/proxy-proto` als Fastify-Middleware integrieren, Feedback-Script erweitern (Punkt setzen, Notiz, Screenshot → POST an Backend, Wunsch-Log).
5. **Terminal-Sideview:** WS → node-pty → `docker exec -it`, Buttons "Neue Session"/"Resume" (`opencode session list` hostseitig füttern).
6. **Hide-AI:** UI-State, blendet Agent-Panel + Wunsch-Log.
7. **Overview:** Karten mit Status/Port/Branch/letzter Session/Kosten-Summe.

## Offene Punkte Phase 1

- Propose-Modus: opencode `permission`-Config (Edit deny) pro Projekt testen.
- Screenshot: Puppeteer vs. CDP gegen Proxy-URL.
- Multi-Tab HMR/Resize im xterm.

## Kontext-Regeln (global)

- Caveman + stop-slop aktiv. Docs/Status direct push auf main, Code via Branch+PR. CHANGELOG oben + PROJECT_STATUS nach jeder Phase.
