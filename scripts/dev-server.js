// 로컬 확인용 간단 서버: 정적 파일 + /api/* 함수 실행 (저장은 .devdata 폴더)
import http from "http";
import { promises as fs } from "fs";
import path from "path";
import { pathToFileURL } from "url";

const ROOT = process.cwd();
const PORT = Number(process.env.PORT || 5173);
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png" };

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  try {
    if (url.pathname.startsWith("/api/")) {
      const name = url.pathname.slice(5).replace(/[^a-z]/g, "");
      const mod = await import(pathToFileURL(path.join(ROOT, "api", name + ".js")).href + "?t=" + Date.now());
      return await mod.default(req, res);
    }
    let p = path.join(ROOT, decodeURIComponent(url.pathname));
    if (url.pathname === "/") p = path.join(ROOT, "index.html");
    if (!p.startsWith(ROOT)) throw new Error("bad path");
    const data = await fs.readFile(p);
    res.writeHead(200, { "Content-Type": TYPES[path.extname(p)] || "application/octet-stream" });
    res.end(data);
  } catch (e) {
    res.writeHead(404); res.end("not found");
  }
}).listen(PORT, () => console.log("dev server http://localhost:" + PORT));
