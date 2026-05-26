import { rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const stagingApiBaseUrl = "https://api-staging.approvu.com";

for (const target of ["dist", ".tanstack/tmp", ".wrangler/deploy"]) {
  rmSync(resolve(rootDir, target), { recursive: true, force: true });
}

process.chdir(rootDir);
process.env.VITE_APPROVU_API_BASE_URL = stagingApiBaseUrl;

const viteBin = resolve(rootDir, "node_modules/vite/bin/vite.js");
const build = spawnSync(process.execPath, ["--bun", viteBin, "build"], {
  cwd: rootDir,
  env: process.env,
  stdio: "inherit",
});

if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

const nodeServer = `import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import worker from "./index.js";

const serverDir = resolve(fileURLToPath(new URL(".", import.meta.url)));
const clientDir = resolve(serverDir, "../client");
const port = Number.parseInt(process.env.PORT ?? "3000", 10);
const host = process.env.HOST ?? "127.0.0.1";

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".gif", "image/gif"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".map", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".txt", "text/plain; charset=utf-8"],
  [".webp", "image/webp"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
]);

function safeClientPath(pathname) {
  const decoded = decodeURIComponent(pathname);
  const normalized = normalize(decoded).replace(/^([/\\\\])+/, "");
  const filePath = resolve(clientDir, normalized);

  if (!filePath.startsWith(clientDir)) {
    return null;
  }

  return filePath;
}

function serveStaticFile(req, res) {
  if (!req.url) return false;

  const url = new URL(req.url, "http://localhost");
  const filePath = safeClientPath(url.pathname);

  if (!filePath || !existsSync(filePath)) {
    return false;
  }

  const stat = statSync(filePath);
  if (!stat.isFile()) {
    return false;
  }

  const contentType = contentTypes.get(extname(filePath).toLowerCase()) ?? "application/octet-stream";
  res.writeHead(200, {
    "content-type": contentType,
    "content-length": stat.size,
    "cache-control": url.pathname.startsWith("/assets/")
      ? "public, max-age=31536000, immutable"
      : "no-cache",
  });
  createReadStream(filePath).pipe(res);
  return true;
}

async function readRequestBody(req) {
  if (req.method === "GET" || req.method === "HEAD") {
    return undefined;
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

function requestOrigin(req) {
  const proto = req.headers["x-forwarded-proto"] ?? "http";
  const hostHeader = req.headers["x-forwarded-host"] ?? req.headers.host ?? \`\${host}:\${port}\`;
  return \`\${Array.isArray(proto) ? proto[0] : proto}://\${Array.isArray(hostHeader) ? hostHeader[0] : hostHeader}\`;
}

function requestHeaders(req) {
  const headers = new Headers();

  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(key, item);
      }
    } else if (value !== undefined) {
      headers.set(key, value);
    }
  }

  return headers;
}

async function writeFetchResponse(res, response) {
  res.statusCode = response.status;
  res.statusMessage = response.statusText;

  response.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "transfer-encoding") {
      res.setHeader(key, value);
    }
  });

  if (!response.body) {
    res.end();
    return;
  }

  await response.body.pipeTo(
    new WritableStream({
      write(chunk) {
        res.write(Buffer.from(chunk));
      },
      close() {
        res.end();
      },
      abort(error) {
        res.destroy(error);
      },
    }),
  );
}

const server = createServer(async (req, res) => {
  try {
    if (serveStaticFile(req, res)) {
      return;
    }

    const body = await readRequestBody(req);
    const request = new Request(new URL(req.url ?? "/", requestOrigin(req)), {
      method: req.method,
      headers: requestHeaders(req),
      body,
    });
    const response = await worker.fetch(request, {}, { waitUntil() {} });
    await writeFetchResponse(res, response);
  } catch (error) {
    console.error(error);
    res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    res.end("Internal Server Error");
  }
});

server.listen(port, host, () => {
  console.log(\`Borrower Node SSR server listening on http://\${host}:\${port}\`);
});
`;

writeFileSync(resolve(rootDir, "dist/server/node-server.mjs"), nodeServer);
console.log("Wrote dist/server/node-server.mjs");
