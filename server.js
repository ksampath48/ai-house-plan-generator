import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generatePlan } from "./lib/generatePlan.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT) || 3000;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
};

const server = createServer(async (req, res) => {
  if (!req.url) {
    return sendJson(res, 400, { success: false, error: "Bad request" });
  }

  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (url.pathname === "/api/health") {
    return sendJson(res, 200, { success: true, status: "ok" });
  }

  if (url.pathname === "/api/generate-plan") {
    if (req.method !== "POST") {
      return sendJson(res, 405, { success: false, error: "Method Not Allowed" });
    }

    try {
      const body = await parseJsonBody(req);
      return sendJson(res, 200, generatePlan(body));
    } catch {
      return sendJson(res, 400, { success: false, error: "Invalid JSON body" });
    }
  }

  return serveStatic(url.pathname, res);
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`AI House Plan Generator running on http://localhost:${PORT}`);
});

async function serveStatic(pathname, res) {
  const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const safePath = path.normalize(relative).replace(/^\.\.(\/|\\|$)/, "");
  const filePath = path.join(__dirname, safePath);

  if (!existsSync(filePath)) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("404 Not Found");
    return;
  }

  const fileStat = await stat(filePath);
  if (fileStat.isDirectory()) {
    return serveStatic(path.join(pathname, "index.html"), res);
  }

  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME_TYPES[ext] || "application/octet-stream";

  res.writeHead(200, {
    "Content-Type": mime,
    "Content-Length": fileStat.size,
    "Cache-Control": "no-cache",
  });

  createReadStream(filePath).pipe(res);
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error("Payload too large"));
      }
    });
    req.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}
