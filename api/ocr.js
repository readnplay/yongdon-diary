// 통장 사진에서 잔액을 읽는다 (Claude API). API 키는 Vercel 환경변수 ANTHROPIC_API_KEY 에만 둔다.
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { checkAuth, readBody, send, incr } from "../lib/store.js";

export const config = { api: { bodyParser: { sizeLimit: "6mb" } }, maxDuration: 60 };

const Row = z.object({
  date: z.string(),
  desc: z.string(),
  deposit: z.number().int(),
  withdraw: z.number().int(),
  balance: z.number().int(),
  is_interest: z.boolean(),
});

const Result = z.object({
  found: z.boolean(),
  balance: z.number().int(),
  last_date: z.string(),
  bank_name: z.string(),
  confidence: z.enum(["high", "medium", "low"]),
  note_ko: z.string(),
  rows: z.array(Row),
});

const prompt = (today) => `오늘은 ${today}입니다. 이 사진은 한국 어린이의 은행 통장(종이 통장의 거래내역 페이지) 또는 은행 앱 화면입니다.
가장 최근(가장 아래쪽 또는 가장 위의 최신) 거래 줄의 "잔액(잔고)" 금액을 찾아 주세요.
- balance: 원 단위 정수 (쉼표·원 표시 제외). 찾지 못하면 0.
- found: 잔액을 찾았으면 true.
- last_date: 그 거래의 날짜(YYYY-MM-DD 형식, 모르면 빈 문자열).
- bank_name: 보이는 은행 이름(모르면 빈 문자열).
- confidence: 숫자가 또렷하면 high, 흐리거나 애매하면 medium/low.
- note_ko: 초등학생에게 보여 줄 짧은 한 문장 (예: "마지막 줄 잔액을 읽었어요!", "이자도 찾았어요!" 또는 "사진이 흐려서 잘 안 보여요. 다시 찍어 볼까요?").
- rows: 사진에 보이는 거래 줄을 위에서 아래(오래된 것→최신) 순서로 모두 적어 주세요 (최대 40줄).
  - date: YYYY-MM-DD. 통장에 연도가 두 자리(예: 26-06-20)거나 없으면 오늘 날짜와 앞뒤 줄을 보고 알맞은 연도를 넣고, 모르면 빈 문자열.
  - desc: 적요를 아주 짧게 일반 단어로만 (예: "입금", "현금입금", "이자", "결산이자", "출금", "이체", "카드"). 사람 이름·가게 이름·숫자는 절대 쓰지 말고 "입금"/"이체"처럼 바꿔 쓰세요.
  - deposit: 맡기신 금액(입금), withdraw: 찾으신 금액(출금), balance: 그 줄의 잔액. 없으면 0. 원 단위 정수.
  - is_interest: 은행이 준 이자 입금 줄이면 true (적요에 "이자", "결산", "예금이자", "이자지급", "결산이자" 등). 이자에서 뗀 세금 줄이나 일반 입금은 false.
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
      max_tokens: 6000,
      output_config: { effort: "medium", format: zodOutputFormat(Result) },
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: m[1], data: m[2] } },
            { type: "text", text: prompt(new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10)) },
          ],
        },
      ],
    });

    if (response.stop_reason === "refusal" || !response.parsed_output) {
      return send(res, 200, { found: false, balance: 0, confidence: "low", rows: [], note_ko: "AI가 잔액을 읽지 못했어요. 직접 눌러서 넣어 주세요." });
    }
    const out = response.parsed_output;
    // 개인정보가 섞이지 않게 한 번 더 정리
    const WORDS = ["현금입금", "자동이체", "입금", "출금", "이체", "카드", "수수료", "세금"];
    out.rows = (out.rows || []).slice(0, 40).map((r) => {
      const d = String(r.desc || "");
      const desc = r.is_interest || /이자|결산/.test(d) ? "이자" : WORDS.find((w) => d.includes(w)) || (r.deposit > 0 ? "입금" : "출금");
      return { ...r, desc };
    });
    return send(res, 200, out);
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
