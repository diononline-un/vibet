# Changelog

## 2026-09-03 — Phase 1: Kern gebaut und e2e verifiziert

- Fastify-Backend (Port 4343): Projekt-Registry (`~/.vibet/projects.json`), Docker-Lebenszyklus, Live-View-Proxy mit HMR-WS + Feedback-Inject, Terminal-WS (shell/opencode/bash), Files-API mit Pfad-Guard, Wish-Log, Git, opencode-Sessions
- React-UI (Vite, Port 5174): Overview-Karten, Projekt-View mit Live/Editor (Monaco)/Terminal (xterm.js)/Wishes/Git/Logs, Hide-AI-Toggle
- Debug-Funde: `@lydell/node-pty` statt node-pty (npm-Build-Block); Vite beantwortet HMR-Upgrades auf fremden Pfaden nicht (Pfad-Strip im WS-Proxy); docker exec-Stdout-Pipe schneidet große JSON ab
- 9 vitest-Tests grün; e2e gegen Vite-Testprojekt verifiziert (Proxy, HMR-Update, Terminal, Files, Hide-AI, Wishes)
- Offen: Propose-Modus, Kostenübersicht (Phase 2), Element-Mapping/Asset-Library/Var-Panel (Phase 3)

## 2026-09-03 — Phase 0: Repo + Spikes abgeschlossen

- Repo `vibet` angelegt (privat, MIT geplant), Fahrplan in 6 Phasen
- Spikes A–E grün: opencode-TUI im Container-PTY, Kosten via `opencode export`,
  docker CLI statt dockerode, Proxy mit HMR + Feedback-Inject, Git hostseitig
- Entscheidungen in `spikes/PHASE0-RESULTS.md` dokumentiert
- Offen: Propose-Modus-Permissions, Screenshot-Mechanik, Port-Strategie
