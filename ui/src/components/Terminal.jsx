import { useEffect, useRef, useState } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { api } from "../api.js";

export default function Terminal({ projectId }) {
  const elRef = useRef(null);
  const termRef = useRef(null);
  const wsRef = useRef(null);
  const fitRef = useRef(null);
  const [mode, setMode] = useState("shell");
  const [sessionId, setSessionId] = useState("");
  const [sessions, setSessions] = useState([]);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    api.sessions().then(setSessions).catch(() => {});
  }, []);

  useEffect(() => {
    if (!elRef.current) return;
    const term = new XTerm({ convertEol: true, fontSize: 12, fontFamily: "monospace", theme: { background: "#0a0a0a" } });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(elRef.current);
    fit.fit();
    termRef.current = term;
    fitRef.current = fit;
    const onResize = () => {
      try {
        fit.fit();
        wsRef.current?.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }));
      } catch {
        // ignore
      }
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      wsRef.current?.close();
      term.dispose();
    };
  }, []);

  const connect = () => {
    wsRef.current?.close();
    const proto = location.protocol === "https:" ? "wss" : "ws";
    const params = new URLSearchParams({ mode });
    if (mode === "opencode" && sessionId) params.set("session", sessionId);
    const ws = new WebSocket(`${proto}://${location.host}/term/${projectId}?${params}`);
    wsRef.current = ws;
    ws.onopen = () => {
      setRunning(true);
      const term = termRef.current;
      ws.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }));
    };
    ws.onmessage = (ev) => termRef.current?.write(ev.data);
    ws.onclose = () => {
      setRunning(false);
      termRef.current?.write("\r\n[vibet] session closed\r\n");
    };
  };

  const disconnect = () => {
    wsRef.current?.close();
  };

  return (
    <div>
      <div className="row" style={{ marginBottom: 8 }}>
        <select value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="shell">shell</option>
          <option value="opencode">opencode</option>
          <option value="bash">bash</option>
        </select>
        {mode === "opencode" && (
          <select value={sessionId} onChange={(e) => setSessionId(e.target.value)}>
            <option value="">new session</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title.slice(0, 50)} ({s.updated})
              </option>
            ))}
          </select>
        )}
        {running ? (
          <button onClick={disconnect}>Disconnect</button>
        ) : (
          <button className="primary" onClick={connect}>Connect</button>
        )}
      </div>
      <div className="term-wrap">
        <div ref={elRef} className="xterm" />
      </div>
    </div>
  );
}
