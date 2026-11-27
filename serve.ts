// Local zero-dependency static server for Retto Almanac (app/).
// Usage: node serve.ts [--port 8080]

import { createReadStream, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = resolve(fileURLToPath(new URL("./app", import.meta.url)));
const cliArgs = process.argv.slice(2);
const flagPos = cliArgs.indexOf("--port");
const parsedPort = flagPos >= 0 ? Number(cliArgs[flagPos + 1]) : 8080;
const listenPort = Number.isInteger(parsedPort) && parsedPort > 0 && parsedPort < 65536 ? parsedPort : 8080;

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

createServer((req, res) => {
  const reqUrl = new URL(req.url ?? "/", "http://127.0.0.1");
  let cleanPath: string;
  try {
    cleanPath = decodeURIComponent(reqUrl.pathname);
  } catch {
    res.writeHead(400).end("Bad Request");
    return;
  }

  if (cleanPath.endsWith("/")) cleanPath += "index.html";
  const resolvedFile = resolve(join(appDir, normalize(cleanPath)));
  if (resolvedFile !== appDir && !resolvedFile.startsWith(appDir + sep)) {
    res.writeHead(403).end("Forbidden");
    return;
  }

  try {
    const info = statSync(resolvedFile);
    if (!info.isFile()) throw new Error("Not a regular file");
    res.writeHead(200, {
      "content-type": CONTENT_TYPES[extname(resolvedFile).toLowerCase()] ?? "application/octet-stream",
      "content-length": info.size,
      "cache-control": "no-store",
    });
    createReadStream(resolvedFile).pipe(res);
  } catch {
    res.writeHead(404).end("Not Found");
  }
}).listen(listenPort, "127.0.0.1", () => {
  console.log(`Retto Almanac listening on http://127.0.0.1:${listenPort}`);
});