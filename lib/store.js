// 저장소: Vercel에 연결된 Upstash Redis(REST)를 사용한다.
// 로컬 개발 때(환경변수 없음)는 .devdata 폴더에 파일로 저장한다.
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const PREFIX = "yd:";

export const hasRemote = Boolean(URL_ && TOKEN);
const isVercel = Boolean(process.env.VERCEL);

async function redis(cmd) {
  const r = await fetch(URL_, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
  });
  const j = await r.json();
  if (j.error) throw new Error("저장소 오류: " + j.error);
  return j.result;
}

const DEV_DIR = path.join(process.cwd(), ".devdata");
function devFile(key) {
  return path.join(DEV_DIR, key.replace(/[^a-zA-Z0-9_-]/g, "_") + ".json");
}

export async function get(key) {
  if (hasRemote) {
    const v = await redis(["GET", PREFIX + key]);
    return v == null ? null : JSON.parse(v);
  }
  if (isVercel) throw new Error("NO_STORE");
  try {
    return JSON.parse(await fs.readFile(devFile(key), "utf8"));
  } catch {
    return null;
  }
}

export async function set(key, value, ttlSeconds) {
  if (hasRemote) {
    const cmd = ["SET", PREFIX + key, JSON.stringify(value)];
    if (ttlSeconds) cmd.push("EX", String(ttlSeconds));
    return redis(cmd);
  }
  if (isVercel) throw new Error("NO_STORE");
  await fs.mkdir(DEV_DIR, { recursive: true });
  await fs.writeFile(devFile(key), JSON.stringify(value));
}

export async function incr(key, ttlSeconds) {
  if (hasRemote) {
    const n = await redis(["INCR", PREFIX + key]);
    if (n === 1 && ttlSeconds) await redis(["EXPIRE", PREFIX + key, String(ttlSeconds)]);
    return n;
  }
  const cur = (await get(key)) || 0;
  await set(key, cur + 1);
  return cur + 1;
}

export function hashCode(code, salt) {
  return crypto.createHash("sha256").update(salt + ":" + String(code).trim()).digest("hex");
}

// 가족 비밀번호 확인. 성공하면 null, 실패하면 [status, message]
export async function checkAuth(req) {
  const auth = await get("auth");
  if (!auth) return [428, "NEEDS_SETUP"];
  const ip = String(req.headers["x-forwarded-for"] || "local").split(",")[0].trim();
  const failKey = "fail:" + ip.replace(/[^0-9a-fA-F.:]/g, "");
  const code = req.headers["x-family-code"] || "";
  if (hashCode(code, auth.salt) === auth.hash) return null;
  const n = await incr(failKey, 3600);
  if (n > 30) return [429, "비밀번호를 너무 많이 틀렸어요. 1시간 뒤에 다시 해 주세요."];
  return [401, "가족 비밀번호가 맞지 않아요."];
}

export async function readBody(req) {
  if (req.body !== undefined && req.body !== null && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const s = Buffer.concat(chunks).toString("utf8");
  return s ? JSON.parse(s) : {};
}

export function send(res, status, obj) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(obj));
}

export function storeError(res, e) {
  if (String(e.message).includes("NO_STORE")) {
    return send(res, 503, { error: "온라인 저장소가 아직 연결되지 않았어요. (Vercel에서 Upstash Redis 연결 필요)" });
  }
  console.error(e);
  return send(res, 500, { error: "서버 오류: " + e.message });
}
