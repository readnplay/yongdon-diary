// 처음 한 번: 종이 계약서 사진과 계약 내용(이름 포함)을 온라인 저장소에 넣는다.
// 개인정보라 저장소에만 넣고 코드(공개 저장소)에는 넣지 않는다.
// 사용법: node scripts/seed.mjs <.env 파일> <계약서 사진> <seed json>
import { readFileSync } from "fs";

const [envFile, photoFile, seedFile] = process.argv.slice(2);
const env = Object.fromEntries(
  readFileSync(envFile, "utf8").split(/\r?\n/).filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; })
);
const URL_ = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
const TOKEN = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;
if (!URL_ || !TOKEN) throw new Error("저장소 환경변수가 없어요");

async function redis(cmd) {
  const r = await fetch(URL_, { method: "POST", headers: { Authorization: `Bearer ${TOKEN}` }, body: JSON.stringify(cmd) });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}

const existing = await redis(["GET", "yd:state"]);
if (existing) { console.log("이미 데이터가 있어서 건너뜀 (version", JSON.parse(existing).version, ")"); process.exit(0); }

const photoId = "contract-paper-1";
const b64 = readFileSync(photoFile).toString("base64");
await redis(["SET", "yd:photo:" + photoId, JSON.stringify({ dataUrl: "data:image/webp;base64," + b64, at: new Date().toISOString() })]);

const seed = JSON.parse(readFileSync(seedFile, "utf8"));
seed.contract.paperPhotoId = photoId;
await redis(["SET", "yd:state", JSON.stringify({ version: 1, state: seed, updatedAt: new Date().toISOString() })]);
console.log("완료: 계약서 사진과 계약 내용을 넣었어요");
