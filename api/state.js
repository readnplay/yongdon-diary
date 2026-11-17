// 용돈기입장 전체 데이터 읽기/저장 (버전으로 동시 수정 충돌 방지)
import { get, set, checkAuth, readBody, send, storeError } from "../lib/store.js";

export default async function handler(req, res) {
  try {
    const fail = await checkAuth(req);
    if (fail) {
      if (fail[0] === 428) {
        const doc = await get("state");
        return send(res, 428, { needsSetup: true, hasData: Boolean(doc) });
      }
      return send(res, fail[0], { error: fail[1] });
    }

    if (req.method === "GET") {
      const doc = await get("state");
      return send(res, 200, doc || { version: 0, state: null });
    }

    if (req.method === "POST") {
      const body = await readBody(req);
      const doc = (await get("state")) || { version: 0, state: null };
      if (Number(body.baseVersion) !== Number(doc.version)) {
        return send(res, 409, { error: "CONFLICT", ...doc });
      }
      if (!body.state || typeof body.state !== "object") {
        return send(res, 400, { error: "잘못된 데이터예요." });
      }
      const next = { version: doc.version + 1, state: body.state, updatedAt: new Date().toISOString() };
      await set("state", next);
      // 하루 한 번 백업본을 남겨 둔다 (최근 60일 보관)
      const day = next.updatedAt.slice(0, 10);
      await set("backup:" + day, next, 60 * 24 * 3600);
      return send(res, 200, { version: next.version });
    }

    return send(res, 405, { error: "지원하지 않는 요청" });
  } catch (e) {
    return storeError(res, e);
  }
}
