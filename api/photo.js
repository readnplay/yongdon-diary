// 통장 사진·계약서 사진 저장/불러오기 (가족 비밀번호 필요)
import crypto from "crypto";
import { get, set, checkAuth, readBody, send, storeError } from "../lib/store.js";

export const config = { api: { bodyParser: { sizeLimit: "4mb" } } };

export default async function handler(req, res) {
  try {
    const fail = await checkAuth(req);
    if (fail) return send(res, fail[0], { error: fail[1] });

    if (req.method === "GET") {
      const url = new URL(req.url, "http://x");
      const id = String(url.searchParams.get("id") || "").replace(/[^a-zA-Z0-9_-]/g, "");
      if (!id) return send(res, 400, { error: "사진 번호가 없어요." });
      const p = await get("photo:" + id);
      if (!p) return send(res, 404, { error: "사진이 없어요." });
      res.setHeader("Cache-Control", "private, max-age=86400");
      return send(res, 200, p);
    }

    if (req.method === "POST") {
      const body = await readBody(req);
      const dataUrl = String(body.dataUrl || "");
      if (!/^data:image\/(jpeg|png|webp);base64,/.test(dataUrl)) return send(res, 400, { error: "사진 형식이 아니에요." });
      if (dataUrl.length > 1_500_000) return send(res, 413, { error: "사진이 너무 커요." });
      const id = body.id && /^[a-zA-Z0-9_-]{4,40}$/.test(body.id) ? body.id : crypto.randomBytes(8).toString("hex");
      await set("photo:" + id, { dataUrl, at: new Date().toISOString() });
      return send(res, 200, { id });
    }

    return send(res, 405, { error: "지원하지 않는 요청" });
  } catch (e) {
    return storeError(res, e);
  }
}
