// 통장 사진에서 잔액을 읽는다 (Claude API). API 키는 Vercel 환경변수 ANTHROPIC_API_KEY 에만 둔다.
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { checkAuth, readBody, send, incr } from "../lib/store.js";

export const config = { api: { bodyParser: { sizeLimit: "6mb" } }, maxDuration: 60 };

const Result = z.object({
  found: z.boolean(),
  balance: z.number().int(),
  last_date: z.string(),
  bank_name: z.string(),
  confidence: z.enum(["high", "medium", "low"]),
  note_ko: z.string(),
});

const PROMPT = `이 사진은 한국 어린이의 은행 통장(종이 통장의 거래내역 페이지) 또는 은행 앱 화면입니다.
가장 최근(가장 아래쪽 또는 가장 위의 최신) 거래 줄의 "잔액(잔고)" 금액을 찾아 주세요.
- balance: 원 단위 정수 (쉼표·원 표시 제외). 찾지 못하면 0.
- found: 잔액을 찾았으면 true.
- last_date: 그 거래의 날짜(YYYY-MM-DD 형식, 모르면 빈 문자열).
- bank_name: 보이는 은행 이름(모르면 빈 문자열).
- confidence: 숫자가 또렷하면 high, 흐리거나 애매하면 medium/low.
- note_ko: 초등학생에게 보여 줄 짧은 한 문장 (예: "마지막 줄 잔액을 읽었어요!" 또는 "사진이 흐려서 잘 안 보여요. 다시 찍어 볼까요?").
계좌번호나 이름 같은 개인정보는 절대 결과에 적지 마세요.`;

export default async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "지원하지 않는 요청" });
  const fail = await checkAuth(req).catch(() => [503, "저장소 연결 필요"]);
  if (fail) return send(res, fail[0], { error: fail[1] });
  if (!process.env.ANTHROPIC_API_KEY) {
    return send(res, 503, { error: "AI 키가 아직 설정되지 않았어요. 잔액을 직접 눌러서 넣어 주세요." });
  }
  // 하루 사용 횟수 제한 (비용 보호)
  const day = new Date().toISOString().slice(0, 10);
  const used = await incr("ocr:" + day, 2 * 24 * 3600).catch(() => 0);
  if (used > 30) return send(res, 429, { error: "오늘은 AI 읽기를 많이 했어요. 잔액을 직접 넣어 주세요." });

  try {
    const body = await readBody(req);
    const m = String(body.dataUrl || "").match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
    if (!m) return send(res, 400, { error: "사진 형식이 아니에요." });

    const client = new Anthropic();
    const response = await client.messages.parse({
      model: "claude-opus-5-5",
      max_tokens: 2000,
      output_config: { effort: "low", format: zodOutputFormat(Result) },
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: m[1], data: m[2] } },
            { type: "text", text: PROMPT },
          ],
        },
      ],
    });

    if (response.stop_reason === "refusal" || !response.parsed_output) {
      return send(res, 200, { found: false, balance: 0, confidence: "low", note_ko: "AI가 잔액을 읽지 못했어요. 직접 눌러서 넣어 주세요." });
    }
    return send(res, 200, response.parsed_output);
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return send(res, 503, { error: "AI 키가 올바르지 않아요. 잔액을 직접 넣어 주세요." });
    } else if (error instanceof Anthropic.RateLimitError) {
      return send(res, 429, { error: "AI가 바빠요. 잠시 뒤에 다시 해 보거나 직접 넣어 주세요." });
    } else if (error instanceof Anthropic.APIError) {
      console.error("Anthropic error", error.status, error.message);
      return send(res, 502, { error: "AI 읽기에 실패했어요. 직접 넣어 주세요." });
    }
    console.error(error);
    return send(res, 500, { error: "AI 읽기 중 오류가 났어요. 직접 넣어 주세요." });
  }
}
