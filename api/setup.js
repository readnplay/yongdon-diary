// 처음 설정: 가족 비밀번호 정하기 / 비밀번호 바꾸기
import crypto from "crypto";
import { get, set, hashCode, checkAuth, readBody, send, storeError } from "../lib/store.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return send(res, 405, { error: "지원하지 않는 요청" });
    const body = await readBody(req);
    const code = String(body.newCode || "").trim();
    if (code.length < 4) return send(res, 400, { error: "비밀번호는 4글자 이상으로 정해 주세요." });

    const auth = await get("auth");
    if (auth) {
      // 이미 설정됨 → 기존 비밀번호가 맞아야 바꿀 수 있다
      const fail = await checkAuth(req);
      if (fail) return send(res, fail[0], { error: fail[1] });
    }
    const salt = crypto.randomBytes(16).toString("hex");
    await set("auth", { salt, hash: hashCode(code, salt), at: new Date().toISOString() });
    return send(res, 200, { ok: true });
  } catch (e) {
    return storeError(res, e);
  }
}
