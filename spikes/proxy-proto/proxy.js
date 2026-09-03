import http from "node:http";
import httpProxy from "http-proxy";

const TARGET = "http://127.0.0.1:5517";
const proxy = httpProxy.createProxyServer({ ws: true, selfHandleResponse: true });

proxy.on("proxyRes", (proxyRes, req, res) => {
  const ct = proxyRes.headers["content-type"] || "";
  if (!ct.includes("text/html")) {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
    return;
  }
  let body = "";
  proxyRes.setEncoding("utf8");
  proxyRes.on("data", (chunk) => (body += chunk));
  proxyRes.on("end", () => {
    body = body.replace("</body>", `<script src="/__vibet_feedback.js"></script></body>`);
    const headers = { ...proxyRes.headers };
    delete headers["content-length"];
    res.writeHead(proxyRes.statusCode, headers);
    res.end(body);
  });
});

const server = http.createServer((req, res) => {
  if (req.url === "/__vibet_feedback.js") {
    res.setHeader("content-type", "application/javascript");
    res.end(`(function(){var el=document.createElement('div');el.id='vibet-feedback';el.style.cssText='position:fixed;bottom:10px;right:10px;z-index:99999;background:#111;color:#eee;padding:8px 12px;font:12px monospace;border-radius:6px';el.textContent='vibet feedback layer';document.body.appendChild(el);})();`);
    return;
  }
  proxy.web(req, res, { target: TARGET });
});

server.on("upgrade", (req, socket, head) => {
  proxy.ws(req, socket, head, { target: TARGET });
});

server.listen(4343, () => console.log("vibet proxy on 4343"));
