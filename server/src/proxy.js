import httpProxy from "http-proxy";
import net from "node:net";

const FEEDBACK_URL = "/__vibet/feedback.js";
const stateMap = new WeakMap();

export function createProxy() {
  return httpProxy.createProxyServer({ selfHandleResponse: true });
}

export function bindProxyState(req, state) {
  stateMap.set(req, state);
}

export function feedbackScript(projectId, enabled) {
  if (!enabled) return "";
  return `<script>window.__VIBET={projectId:"${projectId}"}</script><script src="${FEEDBACK_URL}?p=${projectId}"></script>`;
}

function wsUpgrade(clientReq, clientSocket, head, target, projectId) {
  const { hostname, port } = new URL(target);
  const upstream = net.connect(Number(port), hostname);

  let handshakeDone = false;
  let closed = false;

  const destroy = () => {
    if (closed) return;
    closed = true;
    try {
      upstream.destroy();
    } catch {}
    try {
      clientSocket.destroy();
    } catch {}
  };

  upstream.on("connect", () => {
    const strip = `/p/${projectId}`;
    let pathname = (clientReq.url || "/").split("?")[0];
    if (pathname === strip) pathname = "/";
    else if (pathname.startsWith(`${strip}/`)) pathname = pathname.slice(strip.length);
    const query = (clientReq.url || "").includes("?") ? (clientReq.url.split("?")[1] || "") : "";
    let reqLine = `GET ${pathname}${query ? `?${query}` : ""} HTTP/1.1\r\n`;
    const raw = clientReq.rawHeaders;
    for (let i = 0; i < raw.length; i += 2) {
      const key = raw[i].toLowerCase();
      if (key === "host" || key === "connection" || key === "upgrade" || key === "keep-alive") continue;
      reqLine += `${raw[i]}: ${raw[i + 1]}\r\n`;
    }
    reqLine += `host: ${hostname}:${port}\r\n`;
    reqLine += "connection: Upgrade\r\n";
    reqLine += "upgrade: websocket\r\n\r\n";
    upstream.write(reqLine);
    if (head && head.length) upstream.write(head);
    upstream.on("data", (chunk) => {
      if (!handshakeDone) handshakeDone = chunk.toString().includes("101");
      if (!closed) clientSocket.write(chunk);
    });
    clientSocket.on("data", (chunk) => {
      if (!closed) upstream.write(chunk);
    });
    clientSocket.on("error", destroy);
    upstream.on("error", destroy);
    clientSocket.on("close", () => {
      if (!handshakeDone) destroy();
      else {
        closed = true;
        upstream.end();
      }
    });
    upstream.on("close", () => {
      if (!closed) {
        closed = true;
        clientSocket.end();
      }
    });
  });

  upstream.on("error", destroy);
  clientSocket.on("error", destroy);
}

export function attachProxyHandlers(server, proxy, getTarget) {
  proxy.on("proxyRes", (proxyRes, req, res) => {
    const ct = proxyRes.headers["content-type"] || "";
    if (!ct.includes("text/html")) {
      res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
      proxyRes.pipe(res);
      return;
    }
    let body = "";
    proxyRes.setEncoding("utf8");
    proxyRes.on("data", (chunk) => (body += chunk));
    proxyRes.on("end", () => {
      const bound = stateMap.get(req) || {};
      const { project, enabled } = bound.project ? bound : getTarget(req) || {};
      if (project && body.includes("</body>")) {
        body = body.replace("</body>", `${feedbackScript(project.id, enabled)}</body>`);
      }
      const headers = { ...proxyRes.headers };
      delete headers["content-length"];
      res.writeHead(proxyRes.statusCode || 200, headers);
      res.end(body);
    });
  });

  proxy.on("error", (err, req, res) => {
    try {
      if (res.writeHead) res.writeHead(502, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "proxy_error", detail: String(err?.message || err) }));
    } catch {
      // socket already gone
    }
  });

  server.on("upgrade", (req, socket, head) => {
    const pathname = (req.url || "").split("?")[0];
    if (pathname.startsWith("/term/")) return;
    const { project, target } = getTarget(req) || {};
    if (!target) {
      socket.destroy();
      return;
    }
    wsUpgrade(req, socket, head, target, project?.id);
  });
}
