# Phase 0 — Spike-Ergebnisse

Datum: 2026-09-03. Alle Spikes grün. Entscheidungen für Phase 1.

## Spike A — opencode interaktiv im Container (PTY)

**Setup:** `node:24-slim`, opencode-ELF-Binary read-only gemountet
(`opencode` → `/usr/local/bin/opencode`),
Config-Dir read-only gemountet (`~/.config/opencode` → `/root/.config/opencode`).

**Ergebnis:**
- Binary läuft im Container (`opencode --version`, `session list`).
- PTY via `@lydell/node-pty` (prebuilt, kein node-gyp — `node-pty` scheitert an
  npm-Build-Script-Block) + `docker exec -it`: Bash-Prompt und opencode-TUI
  rendern (Alternate Screen, Mouse-Tracking, 134 Escape-Sequenzen in 4s).

**Entscheidung:** `@lydell/node-pty` wird PTY-Bibliothek. TUI-Session = 
`docker exec -it <ctr> opencode [-s <sessionId>]` in xterm.js.

## Spike B — opencode-Data-Dir + Kosten

**Setup:** `~/.local/share/opencode` read-write in Container gemountet.

**Ergebnis:**
- `opencode session list` (ID, Titel, Updated) + `opencode export <id>`
  (JSON: `info.cost`, `info.tokens`, `info.directory`, `info.title`,
  `info.summary`) liefern alles für die Kostenübersicht.
- `opencode stats` = Aggregate (nur CLI-Tabelle, kein JSON-Flag).
- **Gotcha:** `opencode export` durch `docker exec`-Stdout-Pipe gießen =
  deterministisch abgeschnittenes JSON (Exit 0, ~96KB-Chunks). In Datei im
  Container = 2.2MB komplett. Ursache: Bun-stdout-Flush am Pipe-Ende.

**Entscheidung:** vibet-Backend läuft hostseitig und liest Sessions **direkt
vom Host** (`opencode export` auf Host-Binary gegen gemounteten Data-Dir).
Nie Session-Daten durch exec-Pipes ziehen.

## Spike C — dockerode vs. docker CLI

`docker ps --format '{{json .}}'` + `docker inspect` liefern alles Nötige.
dockerode = zusätzliche Kopplung an Docker-API-Version, kein Gewinn.

**Entscheidung:** docker CLI via child_process (+ PTY via `docker exec -it`).

## Spike D — Proxy, HMR, Feedback-Inject

**Setup:** Vite-App im Container (Port-Publish auf 127.0.0.1), `http-proxy`
mit `selfHandleResponse`, HTML-Transform (Script-Inject vor `</body>`),
`proxy.ws` für Upgrades.

**Ergebnis:**
- HTML-Injection funktioniert (Feedback-Script vom Proxy serviert).
- HMR-Websocket läuft durch den Proxy: `connected` + `update`-Messages nach
  File-Touch. Client braucht Subprotocol `vite-hmr` (`new WebSocket(url,
  ["vite-hmr"])`); http-proxy reicht das durch.

**Entscheidung:** Proxy-Architektur für Live-View steht. Feedback-Layer =
  injectetes Script (gleiche Origin via Proxy, keine Extension nötig).

## Spike E — Git vom Host-Pfad

`git -C <projekt-pfad>` (log/status/branch) direkt vom Backend. Trivial.

**Entscheidung:** vibet ruft Git hostseitig auf dem Projekt-Pfad auf; Agent im
Container editiert dieselben Dateien (rw-Mount).

## Offen für Phase 1

- opencode Permission-Flags für Propose-Modus (Edit deny) — braucht Config-Test
  (`permission`-Block in opencode.jsonc pro Projekt).
- Screenshot-Mechanik (Puppeteer vs. CDP) — erst in Phase 1 bauen.
- Port-Strategie: vibet-UI 4343, Projekt-Ports dynamisch ab 5500 auf Loopback.
