import { buildApp } from "./app.js";
import { config } from "./config.js";

const { app } = await buildApp({ logger: true });

await app.listen({ port: config.port, host: "127.0.0.1" });
console.log(`vibet on http://127.0.0.1:${config.port}`);
