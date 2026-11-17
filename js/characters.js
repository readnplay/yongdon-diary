// 용돈 친구(캐릭터) 그림 — 직접 디자인한 오리지널 캐릭터 3종 × 4단계
const SPECIES = {
  coin: {
    label: "반짝 코인족",
    desc: "동전을 먹고 자라는 반짝반짝 친구",
    names: ["반짝알", "코잉", "코인몽", "황금코인몽"],
    body: "#FFC94A", belly: "#FFF1B8", accent: "#F08A00", dark: "#8A4B00", spot: "#FFE38A",
  },
  leaf: {
    label: "새싹 숲족",
    desc: "모은 돈만큼 쑥쑥 자라는 숲 친구",
    names: ["씨앗알", "새싹콩", "잎새몽", "나무왕"],
    body: "#7BD66A", belly: "#E6FFD8", accent: "#2E9E4F", dark: "#1D5E2E", spot: "#B8F0A0",
  },
  piggy: {
    label: "분홍 저금족",
    desc: "저금통을 꼭 안고 다니는 꿀꿀 친구",
    names: ["분홍알", "꿀꿀콩", "저금몽", "보물돼지왕"],
    body: "#FFAFC5", belly: "#FFE6EE", accent: "#F2628C", dark: "#8C2347", spot: "#FFD3E0",
  },
};

const MAX_LV = 20;
function xpNeed(lv) { return 50 + 10 * (lv - 1); }
function levelInfo(xp) {
  let lv = 1, rest = xp;
  while (lv < MAX_LV && rest >= xpNeed(lv)) { rest -= xpNeed(lv); lv++; }
  const need = lv >= MAX_LV ? 0 : xpNeed(lv);
  return { lv, cur: rest, need, max: lv >= MAX_LV };
}
function stageOf(lv) { return lv >= 15 ? 3 : lv >= 8 ? 2 : lv >= 3 ? 1 : 0; }
const STAGE_AT = [1, 3, 8, 15];

function _eyes(cx, cy, gap, r, c) {
  const e = (x) => `
    <ellipse cx="${x}" cy="${cy}" rx="${r}" ry="${r * 1.15}" fill="#2B2135"/>
    <circle cx="${x + r * 0.35}" cy="${cy - r * 0.45}" r="${r * 0.42}" fill="#fff"/>
    <circle cx="${x - r * 0.3}" cy="${cy + r * 0.4}" r="${r * 0.18}" fill="#fff" opacity=".8"/>`;
  return e(cx - gap) + e(cx + gap);
}
function _blush(cx, cy, gap, c) {
  return `<ellipse cx="${cx - gap}" cy="${cy}" rx="9" ry="5" fill="${c}" opacity=".45"/>
          <ellipse cx="${cx + gap}" cy="${cy}" rx="9" ry="5" fill="${c}" opacity=".45"/>`;
}
function _mouth(cx, cy, w, open) {
  if (open) return `<path d="M${cx - w} ${cy} Q${cx} ${cy + w * 1.4} ${cx + w} ${cy} Z" fill="#7A2E3B"/><path d="M${cx - w * 0.5} ${cy + w * 0.55} Q${cx} ${cy + w * 0.9} ${cx + w * 0.5} ${cy + w * 0.55}" fill="#FF8FA3"/>`;
  return `<path d="M${cx - w} ${cy} Q${cx} ${cy + w} ${cx + w} ${cy}" stroke="#2B2135" stroke-width="3" fill="none" stroke-linecap="round"/>`;
}
function _sparkles(c) {
  const s = (x, y, k) => `<path transform="translate(${x} ${y}) scale(${k})" d="M0 -10 L2.5 -2.5 L10 0 L2.5 2.5 L0 10 L-2.5 2.5 L-10 0 L-2.5 -2.5Z" fill="${c}"/>`;
  return `<g class="twinkle">${s(28, 50, 1)}${s(172, 62, 0.8)}${s(160, 160, 0.6)}${s(36, 150, 0.7)}</g>`;
}

function creatureSVG(species, stage, opts = {}) {
  const P = SPECIES[species] || SPECIES.coin;
  const crown = opts.crown; // 적금 통장을 만들면 생기는 왕관
  const S = stage;
  let g = "";

  if (S === 0) {
    // 알
    const crack = opts.crack ? `<path d="M62 100 L76 92 L86 104 L98 90 L110 104 L122 92 L138 100" stroke="${P.dark}" stroke-width="3" fill="none" stroke-linejoin="round"/>` : "";
    g = `
      <ellipse cx="100" cy="178" rx="46" ry="8" fill="#000" opacity=".08"/>
      <g class="wobble">
        <path d="M100 32 C142 32 160 92 160 122 C160 158 134 178 100 178 C66 178 40 158 40 122 C40 92 58 32 100 32Z" fill="#FFFDF6" stroke="${P.accent}" stroke-width="4"/>
        <ellipse cx="78" cy="88" rx="12" ry="9" fill="${P.body}"/>
        <ellipse cx="124" cy="120" rx="16" ry="12" fill="${P.body}"/>
        <ellipse cx="86" cy="146" rx="10" ry="8" fill="${P.spot}"/>
        <ellipse cx="118" cy="70" rx="7" ry="6" fill="${P.spot}"/>
        ${crack}
        <ellipse cx="80" cy="66" rx="10" ry="16" fill="#fff" opacity=".8" transform="rotate(25 80 66)"/>
      </g>`;
    return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">${g}</svg>`;
  }

  const R = [0, 48, 58, 64][S];
  const cx = 100, cy = 122;
  const top = cy - R;

  // 뒤쪽 장식 (날개·꼬리)
  let back = "";
  if (S === 3) {
    const wc = species === "leaf" ? "#C9F5B5" : species === "piggy" ? "#FFF" : "#FFF4C2";
    back += `<path d="M${cx - R + 6} ${cy - 10} C${cx - R - 40} ${cy - 60} ${cx - R - 46} ${cy + 6} ${cx - R - 10} ${cy + 16} C${cx - R - 30} ${cy + 30} ${cx - R - 6} ${cy + 38} ${cx - R + 10} ${cy + 18}Z" fill="${wc}" stroke="${P.accent}" stroke-width="3"/>
             <path d="M${cx + R - 6} ${cy - 10} C${cx + R + 40} ${cy - 60} ${cx + R + 46} ${cy + 6} ${cx + R + 10} ${cy + 16} C${cx + R + 30} ${cy + 30} ${cx + R + 6} ${cy + 38} ${cx + R - 10} ${cy + 18}Z" fill="${wc}" stroke="${P.accent}" stroke-width="3"/>`;
  }
  if (species === "piggy" && S >= 2) {
    back += `<path d="M${cx + R - 4} ${cy + 22} c18 -4 22 14 10 16 c-10 2 -8 -12 4 -10" stroke="${P.accent}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  }
  if (species === "coin" && S >= 2) {
    back += `<circle cx="${cx + R + 2}" cy="${cy + 20}" r="11" fill="${P.accent}"/><circle cx="${cx + R + 2}" cy="${cy + 20}" r="6" fill="${P.body}"/>`;
  }
  if (species === "leaf" && S >= 2) {
    back += `<path d="M${cx + R - 8} ${cy + 26} q26 -6 30 -30 q-24 2 -30 30Z" fill="${P.accent}"/>`;
  }

  // 귀
  let ears = "";
  if (species === "coin") {
    const er = [0, 11, 14, 15][S];
    ears = `<circle cx="${cx - R * 0.62}" cy="${top + R * 0.28}" r="${er}" fill="${P.body}" stroke="${P.accent}" stroke-width="3"/>
            <circle cx="${cx + R * 0.62}" cy="${top + R * 0.28}" r="${er}" fill="${P.body}" stroke="${P.accent}" stroke-width="3"/>
            <circle cx="${cx - R * 0.62}" cy="${top + R * 0.28}" r="${er * 0.5}" fill="${P.spot}"/>
            <circle cx="${cx + R * 0.62}" cy="${top + R * 0.28}" r="${er * 0.5}" fill="${P.spot}"/>`;
  } else if (species === "piggy") {
    const k = [0, 1, 1.25, 1.35][S];
    ears = `<path d="M${cx - R * 0.75} ${top + R * 0.45} l${-6 * k} ${-26 * k} l${24 * k} ${12 * k}Z" fill="${P.body}" stroke="${P.accent}" stroke-width="3" stroke-linejoin="round"/>
            <path d="M${cx + R * 0.75} ${top + R * 0.45} l${6 * k} ${-26 * k} l${-24 * k} ${12 * k}Z" fill="${P.body}" stroke="${P.accent}" stroke-width="3" stroke-linejoin="round"/>`;
  } else {
    const k = [0, 1, 1.2, 1.3][S];
    ears = `<ellipse cx="${cx - R * 0.8}" cy="${cy - R * 0.2}" rx="${7 * k}" ry="${14 * k}" fill="${P.body}" stroke="${P.accent}" stroke-width="3" transform="rotate(-35 ${cx - R * 0.8} ${cy - R * 0.2})"/>
            <ellipse cx="${cx + R * 0.8}" cy="${cy - R * 0.2}" rx="${7 * k}" ry="${14 * k}" fill="${P.body}" stroke="${P.accent}" stroke-width="3" transform="rotate(35 ${cx + R * 0.8} ${cy - R * 0.2})"/>`;
  }

  // 몸통
  const body = `
    <ellipse cx="${cx}" cy="${cy + R - 2}" rx="${R * 0.9}" ry="8" fill="#000" opacity=".08"/>
    <ellipse cx="${cx - R * 0.45}" cy="${cy + R - 6}" rx="${R * 0.28}" ry="${R * 0.16}" fill="${P.accent}"/>
    <ellipse cx="${cx + R * 0.45}" cy="${cy + R - 6}" rx="${R * 0.28}" ry="${R * 0.16}" fill="${P.accent}"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${R}" ry="${R * 0.95}" fill="${P.body}" stroke="${P.accent}" stroke-width="3.5"/>
    <ellipse cx="${cx}" cy="${cy + R * 0.32}" rx="${R * 0.6}" ry="${R * 0.48}" fill="${P.belly}"/>
    <ellipse cx="${cx - R * 0.45}" cy="${cy - R * 0.55}" rx="${R * 0.16}" ry="${R * 0.1}" fill="#fff" opacity=".6" transform="rotate(-30 ${cx - R * 0.45} ${cy - R * 0.55})"/>`;

  // 팔 (2단계부터)
  let arms = "";
  if (S >= 2) {
    arms = `<ellipse cx="${cx - R * 0.92}" cy="${cy + R * 0.25}" rx="${R * 0.18}" ry="${R * 0.26}" fill="${P.body}" stroke="${P.accent}" stroke-width="3" transform="rotate(20 ${cx - R * 0.92} ${cy + R * 0.25})"/>
            <ellipse cx="${cx + R * 0.92}" cy="${cy + R * 0.25}" rx="${R * 0.18}" ry="${R * 0.26}" fill="${P.body}" stroke="${P.accent}" stroke-width="3" transform="rotate(-20 ${cx + R * 0.92} ${cy + R * 0.25})"/>`;
  }

  // 얼굴
  const ey = cy - R * 0.18;
  let face = _eyes(cx, ey, R * 0.32, R * 0.12) + _blush(cx, ey + R * 0.26, R * 0.55, P.accent);
  if (species === "piggy") {
    face += `<ellipse cx="${cx}" cy="${ey + R * 0.3}" rx="${R * 0.22}" ry="${R * 0.15}" fill="${P.spot}" stroke="${P.accent}" stroke-width="2.5"/>
             <ellipse cx="${cx - R * 0.08}" cy="${ey + R * 0.3}" rx="3" ry="4" fill="${P.dark}"/>
             <ellipse cx="${cx + R * 0.08}" cy="${ey + R * 0.3}" rx="3" ry="4" fill="${P.dark}"/>`;
    face += _mouth(cx, ey + R * 0.5, R * 0.1, opts.happy);
  } else {
    face += _mouth(cx, ey + R * 0.3, R * 0.13, opts.happy);
  }

  // 머리 장식
  let head = "";
  if (species === "coin") {
    head = `<rect x="${cx - R * 0.22}" y="${top + 6}" width="${R * 0.44}" height="7" rx="3.5" fill="${P.dark}"/>`;
    if (S >= 2) head += `<g transform="translate(${cx} ${cy + R * 0.32})"><circle r="${R * 0.2}" fill="${P.body}" stroke="${P.accent}" stroke-width="3"/><text y="${R * 0.08}" text-anchor="middle" font-size="${R * 0.24}" font-weight="900" fill="${P.accent}">₩</text></g>`;
  } else if (species === "leaf") {
    const leaf = (rot, len) => `<path transform="rotate(${rot} ${cx} ${top + 2})" d="M${cx} ${top + 2} q${len * 0.55} ${-len * 0.45} 0 ${-len} q${-len * 0.55} ${len * 0.45} 0 ${len}Z" fill="${P.accent}" stroke="${P.dark}" stroke-width="2"/>`;
    head = `<path d="M${cx} ${top + 4} v-8" stroke="${P.dark}" stroke-width="3"/>`;
    if (S === 1) head += leaf(25, 26);
    if (S === 2) head += leaf(-35, 30) + leaf(35, 30);
    if (S === 3) head += leaf(-50, 30) + leaf(50, 30) + leaf(0, 36) + `<circle cx="${cx}" cy="${top - 30}" r="9" fill="#FFD84D" stroke="#F08A00" stroke-width="2"/>`;
  } else if (species === "piggy" && S >= 2) {
    head = `<path d="M${cx - R * 0.7} ${cy + R * 0.02} Q${cx} ${cy + R * 0.22} ${cx + R * 0.7} ${cy + R * 0.02} L${cx + R * 0.6} ${cy + R * 0.18} Q${cx} ${cy + R * 0.38} ${cx - R * 0.6} ${cy + R * 0.18}Z" fill="#5BB8FF" opacity=".9"/>`;
  }

  // 3단계 왕관 / 적금 왕관
  let crownG = "";
  if (S === 3 || crown) {
    const cw = R * 0.62, by = top + (species === "leaf" ? -6 : 4);
    const col = crown ? "#FFD84D" : species === "leaf" ? "#FF9EC4" : "#FFD84D";
    crownG = `<path d="M${cx - cw / 2} ${by} l0 -22 l${cw * 0.25} 12 l${cw * 0.25} -20 l${cw * 0.25} 20 l${cw * 0.25} -12 l0 22Z" fill="${col}" stroke="#E08A00" stroke-width="2.5" stroke-linejoin="round"/>
              <circle cx="${cx}" cy="${by - 8}" r="4" fill="#FF5A7A"/>`;
  }

  g = back + ears + body + arms + head + face + crownG + (S === 3 ? _sparkles("#FFD84D") : "");
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><g class="bob">${g}</g></svg>`;
}

const CHAR_LINES = {
  idle: [
    "오늘도 같이 용돈 지켜 보자!",
    "기록할 때마다 나도 쑥쑥 자라!",
    "사기 전에 '꼭 필요해?' 한 번만 물어보자~",
    "저금통이 무거워지면 기분이 좋아!",
    "통장 정리하면 나한테 사진 보여 줘!",
    "작은 돈도 모이면 큰 돈이 돼!",
    "기부하면 마음이 따뜻해져~",
    "실수해도 괜찮아. 기록하면 배울 수 있어!",
  ],
  egg: ["(알이 꼼지락꼼지락...)", "(톡톡! 안에서 무슨 소리가 나요)", "(따뜻해요. 곧 태어날 것 같아요)"],
  fed: ["냠냠! 통장 사진 고마워!", "우와, 통장이 든든해졌다!", "은행에 다녀왔구나! 멋져!"],
};

// 레벨업 때 한 문제씩 나오는 OX 돈 퀴즈
const QUIZ = [
  ["적금은 돈을 조금씩 여러 번 넣어서 모으는 저축이다.", true, "맞아요! 적금은 정해진 기간 동안 조금씩 넣어서 모아요."],
  ["예금은 모아 둔 돈을 한 번에 맡기는 저축이다.", true, "맞아요! 목돈을 한 번에 맡기고 약속한 날까지 기다려요."],
  ["적금을 약속한 날보다 먼저 깨면 이자를 더 많이 받는다.", false, "아니에요. 먼저 꺼내면 이자가 줄어들어요."],
  ["'갖고 싶은 것'과 '꼭 필요한 것'은 항상 같다.", false, "아니에요. 필요한 것과 갖고 싶은 것을 구분하는 게 똑똑한 소비예요."],
  ["은행에 돈을 맡기면 은행이 이자를 준다.", true, "맞아요! 이자는 은행이 고맙다고 얹어 주는 돈이에요."],
  ["잔액은 들어온 돈에서 쓴 돈을 뺀 돈이다.", true, "맞아요! 그래서 기록을 잘하면 잔액이 딱 맞아요."],
  ["친구에게 돈을 빌려서 갖고 싶은 걸 사는 건 좋은 습관이다.", false, "아니에요. 우리 계약서에도 '빌리지 않기' 약속이 있어요."],
  ["기부는 내 돈의 일부로 다른 사람을 돕는 것이다.", true, "맞아요! 작은 돈도 누군가에게 큰 도움이 돼요."],
  ["통장 정리를 하면 통장에 돈이 얼마 있는지 알 수 있다.", true, "맞아요! ATM에 통장을 넣으면 거래 내역이 찍혀요."],
  ["비싼 물건은 무조건 좋은 물건이다.", false, "아니에요. 가격보다 나에게 필요한지가 더 중요해요."],
  ["사기 전에 하루만 기다려 보면 충동구매를 줄일 수 있다.", true, "맞아요! 내일도 갖고 싶으면 그때 생각해 봐요."],
  ["1,000원짜리 과자를 5번 사면 5,000원을 쓴 것이다.", true, "맞아요! 작은 돈도 여러 번 쓰면 커져요."],
  ["세뱃돈처럼 갑자기 생긴 돈은 기록하지 않아도 된다.", false, "아니에요. 특별용돈도 꼭 기록하고 나눠요."],
  ["통장 비밀번호는 친한 친구에게 알려 줘도 된다.", false, "절대 안 돼요! 비밀번호는 나와 부모님만 알아야 해요."],
  ["저금통 돈은 목표를 위해 모으는 돈이다.", true, "맞아요! 목표를 정하면 모으는 게 더 재밌어요."],
  ["광고에 나오는 물건은 꼭 사야 한다.", false, "아니에요. 광고는 사고 싶게 만드는 이야기일 뿐이에요."],
  ["매일 100원씩 30일 모으면 3,000원이 된다.", true, "맞아요! 100 × 30 = 3,000원!"],
  ["돈이 모자라면 다음 용돈을 미리 당겨 쓰는 게 좋다.", false, "아니에요. 계획한 만큼만 쓰는 연습을 해요."],
  ["은행은 돈을 안전하게 보관해 주는 곳이다.", true, "맞아요! 집보다 은행이 훨씬 안전해요."],
  ["가격표를 비교해 보면 같은 물건을 더 싸게 살 수도 있다.", true, "맞아요! 비교하는 습관이 돈을 아껴 줘요."],
];
