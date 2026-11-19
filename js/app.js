"use strict";
/* ===========================================================
   용돈 친구 — 초등학생 용돈기입장 + 캐릭터 키우기
   =========================================================== */

// ---------- 기본 상수 ----------
const JARS = [
  { k: "spend", name: "소비", icon: "🛍️", c: "var(--spend)", ds: "쓰는 돈" },
  { k: "gift", name: "경조사", icon: "🎁", c: "var(--gift)", ds: "선물·축하 돈" },
  { k: "piggy", name: "저금통", icon: "🐷", c: "var(--piggy)", ds: "단기저축" },
  { k: "bank", name: "은행 갈 돈", icon: "🏦", c: "var(--bank)", ds: "장기저축" },
  { k: "give", name: "기부", icon: "💝", c: "var(--give)", ds: "나누는 돈" },
];
const JK = JARS.map((j) => j.k);
const JAR = Object.fromEntries(JARS.map((j) => [j.k, j]));

const CATS = {
  spend: [["간식", "🍪"], ["문구", "✏️"], ["장난감", "🧸"], ["책", "📚"], ["게임·앱", "🎮"], ["꾸미기", "🎀"], ["교통", "🚌"], ["기타", "✨"]],
  piggy: [["목표 물건", "🎯"], ["장난감", "🧸"], ["책", "📚"], ["게임·앱", "🎮"], ["체험·놀이", "🎡"], ["기타", "✨"]],
  gift: [["가족 생일", "🎂"], ["친구 생일", "🎈"], ["축하 선물", "🎉"], ["위로·병문안", "💐"], ["감사 선물", "🙏"], ["기타", "✨"]],
  give: [["학교 기부함", "🏫"], ["어린이 돕기", "🧒"], ["동물 보호", "🐶"], ["환경 지키기", "🌳"], ["이웃 돕기", "🏘️"], ["기타", "✨"]],
};

const BADGES = {
  first_record: ["📝", "첫 기록"], rec7: ["🗓️", "기록 7일"], rec30: ["📚", "기록 30일"], rec100: ["🏅", "기록 100일"],
  first_review: ["🔍", "첫 돌아보기"], review5: ["🧠", "돌아보기 5번"],
  first_deposit: ["🏦", "첫 입금"], solo_deposit: ["🦸", "혼자 은행 다녀오기"], deposit6: ["🔁", "입금 6번"],
  first_photo: ["📸", "첫 통장 사진"],
  bal10k: ["💎", "통장 100만 원"], bal30k: ["💰", "통장 300만 원"], bal50k: ["🏆", "통장 500만 원"], bal100k: ["👑", "통장 1,000만 원"],
  first_give: ["💝", "첫 기부"], goal_done: ["🎯", "목표 달성"], contract_sign: ["✍️", "계약서 서명"],
  chore: ["🧹", "노력 용돈"], savings_ready: ["🌱", "적금 준비 완료"], savings_open: ["🌟", "적금 통장 개설"], match: ["⚖️", "잔액 딱 맞추기"],
  first_interest: ["🎁", "첫 이자 발견"]
};

const PROMISES = ["매일 기록하기", "간식은 조금만", "저금통에 더 넣기", "은행 가서 입금하기", "목표 위해 모으기", "사기 전에 하루 생각하기", "기부하기", "가격 비교하기"];
const TALK_QS = [
  "이번 2주 동안 가장 뿌듯했던 돈 쓰기는 뭐였어?",
  "만약 1,000원이 더 있었다면 어디에 쓰고 싶어?",
  "저금통이 가득 차면 뭘 하고 싶어?",
  "기부한 돈은 누구에게 도움이 될까?",
  "갖고 싶은 것과 꼭 필요한 것은 어떻게 구분해?",
  "사고 나서 후회한 적 있어? 다음엔 어떻게 할까?",
  "통장에 돈이 쌓이는 걸 보면 기분이 어때?",
];
const PRAISE_TEMPLATES = ["기록을 꾸준히 해서 정말 멋져!", "은행에 다녀온 거 대단해!", "필요한 것과 갖고 싶은 것을 잘 구분했구나!", "기부하는 마음이 참 예뻐.", "목표를 위해 참고 모은 거 정말 자랑스러워!"];

function defaultContract() {
  return {
    version: 1, child: "", parents: "",
    start: "2026-10-17", end: "2027-02-28", firstPayday: "2026-10-17", cycleDays: 14, base: 5000,
    baseSplit: { spend: { t: "fixed", v: 2000 }, gift: { t: "fixed", v: 1000 }, piggy: { t: "none", v: 0 }, bank: { t: "fixed", v: 2000 }, give: { t: "none", v: 0 } },
    specialSplit: { spend: { t: "fixed", v: 2000 }, gift: { t: "none", v: 0 }, give: { t: "fixed", v: 1000 }, piggy: { t: "pct", v: 20 }, bank: { t: "rest", v: 0 } },
    choreSplit: { spend: { t: "pct", v: 50 }, gift: { t: "none", v: 0 }, give: { t: "none", v: 0 }, piggy: { t: "rest", v: 0 }, bank: { t: "none", v: 0 } },
    clauses: [
      "용돈을 받고 쓸 때마다 항상 용돈기입장에 기록한다.",
      "돈을 아껴 쓸 것이며 정해진 대로 체계적으로 돈을 관리한다.",
      "약속된 용돈 외에 더 많은 돈을 벌고 싶을 때는 용돈 메뉴판에 적힌 일을 하고 노력 용돈을 번다.",
      "빚을 지거나 돈을 빌리지 않겠습니다.",
    ],
    signedAt: "2026-10-17", sigChild: null, sigParent: null, paperPhotoId: null, note: "",
  };
}
function defaultState() {
  return {
    schema: 1, startedAt: today(), startSetAt: null, tierSeen: 0,
    profile: { species: null, nickname: "" },
    contract: defaultContract(), contractHistory: [], proposals: [],
    menu: [
      { id: uid(), name: "신발 정리하기", price: 300, emoji: "👟" },
      { id: uid(), name: "설거지 돕기", price: 500, emoji: "🍽️" },
      { id: uid(), name: "분리수거 하기", price: 500, emoji: "♻️" },
    ],
    txs: [], noSpend: {}, reviews: [], goals: [],
    bank: { records: [], products: [] },
    savingsRule: { deposits: 6, minBalance: 30000 },
    xp: 0, xpKeys: {}, xpLog: [], badges: {}, praises: [],
    parentPinHash: "",
  };
}

// ---------- 도우미 ----------
const $ = (s) => document.querySelector(s);
const fmt = (n) => (Math.round(n || 0)).toLocaleString("ko-KR") + "원";
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function esc(s) { return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
// 받침에 따라 조사 고르기: jo("코잉","이에요","예요")
function jo(w, withB, noB) {
  const c = String(w).charCodeAt(String(w).length - 1);
  if (c < 0xac00 || c > 0xd7a3) return w + noB;
  return w + ((c - 0xac00) % 28 ? withB : noB);
}
function pad2(n) { return String(n).padStart(2, "0"); }
function dstr(d) { return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); }
function today() { return dstr(new Date()); }
function pdate(s) { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); }
function addDays(s, n) { const d = pdate(s); d.setDate(d.getDate() + n); return dstr(d); }
function daysBetween(a, b) { return Math.round((pdate(b) - pdate(a)) / 86400000); }
const WD = ["일", "월", "화", "수", "목", "금", "토"];
function kdate(s) { const d = pdate(s); return `${d.getMonth() + 1}월 ${d.getDate()}일(${WD[d.getDay()]})`; }
function lsGet(k, def) { try { const v = localStorage.getItem(k); return v == null ? def : JSON.parse(v); } catch { return def; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
async function sha(s) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("yd-pin:" + s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

// ---------- 서버 동기화 ----------
let S = null, VER = 0, CODE = lsGet("yd_code", ""), pending = [], saving = false, syncState = "ok";
let TAB = lsGet("yd_tab", "home");
const PHOTO_CACHE = {};

async function api(path, { method = "GET", body } = {}) {
  const r = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json", "x-family-code": CODE },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = {};
  try { data = await r.json(); } catch {}
  return { status: r.status, data };
}

function setSync(s) {
  syncState = s;
  const el = $("#sync");
  if (el) el.textContent = s === "ok" ? "☁️ 저장됨" : s === "saving" ? "☁️ 저장 중…" : "⚠️ 인터넷 확인";
}

// 상태를 바꾸는 모든 동작은 commit 으로: 화면에 바로 반영하고, 서버에 저장 (충돌 시 다시 적용)
let lastGain = 0;
function commit(fn) {
  lastGain = 0;
  fn(S);
  const gain = lastGain;
  pending.push(fn);
  lsSet("yd_cache", { VER, S });
  render();
  if (gain > 0) floatXP(gain);
  flush();
  checkLevelUp();
}
async function flush() {
  if (saving) return;
  saving = true;
  while (pending.length) {
    const n = pending.length;
    setSync("saving");
    try {
      const r = await api("/api/state", { method: "POST", body: { baseVersion: VER, state: S } });
      if (r.status === 200) {
        VER = r.data.version;
        pending.splice(0, n);
      } else if (r.status === 409) {
        S = migrate(r.data.state || defaultState());
        VER = r.data.version;
        for (const f of pending) f(S);
        render();
      } else if (r.status === 401) {
        saving = false; showLogin(r.data.error); return;
      } else {
        throw new Error(r.data.error || "저장 실패");
      }
    } catch (e) {
      setSync("offline");
      saving = false;
      setTimeout(flush, 6000);
      return;
    }
  }
  setSync("ok");
  lsSet("yd_cache", { VER, S });
  saving = false;
}
async function refresh() {
  if (pending.length || saving || !CODE || !S) return;
  if (document.querySelector(".modal") || document.querySelector(".celebrate")) return;
  const r = await api("/api/state").catch(() => null);
  if (r && r.status === 200 && r.data.version > VER) {
    S = migrate(r.data.state); VER = r.data.version; render(); checkLevelUp();
  }
}
setInterval(refresh, 45000);
document.addEventListener("visibilitychange", () => { if (!document.hidden) refresh(); });

function migrate(st) {
  const d = defaultState();
  for (const k of Object.keys(d)) if (st[k] === undefined) st[k] = d[k];
  st.contract = Object.assign(defaultContract(), st.contract || {});
  return st;
}

// ---------- 계산 ----------
const C = () => S.contract;
function bal(jar, upTo) { let s = 0; for (const t of S.txs) if (t.jar === jar && (!upTo || t.date <= upTo)) s += t.amount; return s; }
function total() { return JK.reduce((a, k) => a + bal(k), 0); }
function cycleOf(date) { const c = C(); return Math.max(0, Math.floor(daysBetween(c.firstPayday, date) / (c.cycleDays || 14))); }
function payday(i) { const c = C(); return addDays(c.firstPayday, i * (c.cycleDays || 14)); }
function curCycle() { return cycleOf(today()); }
function startCycle() { return cycleOf(S.startedAt || today()); }
function txsInCycle(i) { const a = payday(i), b = payday(i + 1); return S.txs.filter((t) => t.date >= a && t.date < b); }

function computeSplit(amount, rules) {
  const out = Object.fromEntries(JK.map((k) => [k, 0]));
  let left = amount;
  for (const k of JK) { const r = rules[k]; if (r && r.t === "fixed") { const a = Math.min(r.v, left); out[k] = a; left -= a; } }
  for (const k of JK) { const r = rules[k]; if (r && r.t === "pct") { const a = Math.min(Math.floor((amount * r.v) / 100 / 10) * 10, left); out[k] = a; left -= a; } }
  const restK = JK.find((k) => rules[k] && rules[k].t === "rest") || "spend";
  out[restK] += left;
  return out;
}

function bankAccounts() {
  return [{ id: "main", name: "입출금 통장", type: "입출금" }, ...S.bank.products.map((p) => ({ id: p.id, name: p.name || p.type + " 통장", type: p.type }))];
}
function bankEstimate(acc = "main") {
  const recs = S.bank.records.filter((r) => (r.account || "main") === acc).sort((a, b) => (a.at < b.at ? -1 : 1));
  const last = recs[recs.length - 1];
  const deps = S.txs.filter((t) => t.kind === "deposit" && (t.to || "main") === acc);
  if (!last) return { est: deps.reduce((a, t) => a - t.amount, 0), last: null };
  const after = deps.filter((t) => t.at > last.at).reduce((a, t) => a - t.amount, 0);
  return { est: last.balance + after, last };
}
function depositCount() { return S.txs.filter((t) => t.kind === "deposit").length; }
function savingsProgress() {
  const rule = S.savingsRule;
  const dc = depositCount(), b = bankEstimate("main").est;
  return { dc, b, ready: dc >= rule.deposits && b >= rule.minBalance, rule };
}
function recordDays() { const set = new Set(); for (const k of Object.keys(S.xpKeys)) if (k.startsWith("rec:")) set.add(k); return set.size; }

// ---------- XP·배지 (mutator 안에서만 호출) ----------
function addXP(st, key, amt, reason) {
  if (key && st.xpKeys[key]) return 0;
  if (key) st.xpKeys[key] = 1;
  st.xp += amt;
  st.xpLog.unshift({ at: new Date().toISOString(), amt, reason });
  if (st.xpLog.length > 150) st.xpLog.length = 150;
  lastGain += amt;
  return amt;
}
function addBadge(st, key, bonus = 0) {
  if (st.badges[key]) return;
  st.badges[key] = today();
  if (bonus) addXP(st, "badge:" + key, bonus, "배지: " + BADGES[key][1]);
  setTimeout(() => toast(`${BADGES[key][0]} 새 배지! '${BADGES[key][1]}'`), 900);
}
function recordToday(st, date = today()) {
  addXP(st, "rec:" + date, 5, "오늘 기록");
  const days = Object.keys(st.xpKeys).filter((k) => k.startsWith("rec:")).length;
  addBadge(st, "first_record");
  if (days >= 7) addBadge(st, "rec7");
  if (days >= 30) addBadge(st, "rec30");
  if (days >= 100) addBadge(st, "rec100");
}
function checkBankBadges(st, balance) {
  if (balance >= 1000000) addBadge(st, "bal10k", 50);
  if (balance >= 3000000) addBadge(st, "bal30k", 50);
  if (balance >= 5000000) addBadge(st, "bal50k", 50);
  if (balance >= 10000000) addBadge(st, "bal100k", 50);
}

// ---------- 화면 공통 ----------
function toast(msg, ms = 2400) {
  const t = document.createElement("div");
  t.className = "toast"; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), ms);
}
function floatXP(n) {
  const t = document.createElement("div");
  t.className = "xpfloat"; t.textContent = `+${n} XP`;
  t.style.left = "50%"; t.style.top = "40%";
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1500);
}
function openModal(html, opts = {}) {
  closeModal();
  const m = document.createElement("div");
  m.className = "modal";
  m.innerHTML = `<div class="sheet">${html}</div>`;
  if (!opts.locked) m.addEventListener("click", (e) => { if (e.target === m) closeModal(); });
  $("#modals").appendChild(m);
  hydratePhotos(m);
  return m;
}
function setModal(html) { const s = document.querySelector(".modal .sheet"); if (s) { s.innerHTML = html; s.scrollTop = 0; hydratePhotos(s); } else openModal(html); }
function closeModal() {
  const had = $("#modals").innerHTML !== "";
  $("#modals").innerHTML = "";
  if (had) setTimeout(() => { if (!document.querySelector(".modal")) { checkLevelUp(); showUnreadPraise(); } }, 500);
}
function head(title, back) {
  return `<div class="sheethead">${back ? `<button class="iconbtn" onclick="${back}">←</button>` : ""}<h2>${title}</h2><button class="iconbtn" onclick="closeModal()">✕</button></div>`;
}
function photoImg(id, cls = "photo-prev") { return id ? `<img class="${cls}" data-photo="${esc(id)}" alt="사진">` : ""; }
async function hydratePhotos(root) {
  for (const img of root.querySelectorAll("img[data-photo]")) {
    const id = img.dataset.photo;
    if (PHOTO_CACHE[id]) { img.src = PHOTO_CACHE[id]; continue; }
    api("/api/photo?id=" + encodeURIComponent(id)).then((r) => {
      if (r.status === 200) { PHOTO_CACHE[id] = r.data.dataUrl; img.src = r.data.dataUrl; }
    });
  }
}

// 금액 키패드
let KP = { v: 0, max: Infinity, onchange: null };
function keypad(init = 0, max = Infinity, onchange) {
  KP = { v: init, max, onchange };
  const q = [100, 500, 1000, 5000, 10000];
  return `<div class="amount num" id="kpv">${fmt(init)}</div>
    <div class="quick">${q.map((n) => `<button class="key" onclick="kpAdd(${n})">+${n >= 10000 ? n / 10000 + "만" : n.toLocaleString()}</button>`).join("")}</div>
    <div class="keys">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => `<button class="key" onclick="kpDigit('${d}')">${d}</button>`).join("")}
    <button class="key" onclick="kpClear()" style="font-size:1.1rem">지우기</button><button class="key" onclick="kpDigit('0')">0</button><button class="key" onclick="kpDigit('00')">00</button></div>`;
}
function kpSet(v) {
  v = Math.max(0, Math.min(v, 99999999));
  if (v > KP.max) { toast(`${fmt(KP.max)}까지만 할 수 있어요`); v = KP.max; }
  KP.v = v;
  const el = $("#kpv"); if (el) el.textContent = fmt(v);
  if (KP.onchange) KP.onchange(v);
}
function kpAdd(n) { kpSet(KP.v + n); }
function kpDigit(d) { kpSet(Number(String(KP.v) + d)); }
function kpClear() { kpSet(0); }

// ---------- 시작 ----------
async function boot() {
  const cached = lsGet("yd_cache", null);
  if (CODE && cached && cached.S) { S = migrate(cached.S); VER = cached.VER; render(); }
  let r;
  try { r = await api("/api/state"); } catch { setSync("offline"); if (!S) showError("인터넷에 연결되어 있지 않아요."); return; }
  if (r.status === 428) return showSetup(r.data.hasData);
  if (r.status === 401 || r.status === 429) return showLogin(CODE ? r.data.error : "");
  if (r.status !== 200) return showError(r.data.error || "서버에 문제가 있어요.");
  if (!r.data.state) {
    S = defaultState(); VER = r.data.version || 0;
    commit(() => {});
  } else { S = migrate(r.data.state); VER = r.data.version; }
  if (lsGet("yd_seenLv", null) == null) lsSet("yd_seenLv", levelInfo(S.xp).lv);
  render();
  checkLevelUp();
  showUnreadPraise();
}
function showError(msg) {
  $("#app").innerHTML = `<div class="card center" style="margin-top:20vh"><h2>앗!</h2><p>${esc(msg)}</p><button class="btn" onclick="location.reload()">다시 해 보기</button></div>`;
}
function showLogin(err) {
  $("#tabbar").classList.add("hide");
  $("#app").innerHTML = `<div class="card center" style="margin-top:12vh;max-width:440px;margin-left:auto;margin-right:auto">
    <div style="font-size:4rem">🐣</div><h2>용돈 친구</h2>
    <p class="muted">가족 비밀번호를 넣어 주세요.<br>(처음 한 번만 넣으면 돼요)</p>
    ${err ? `<p class="notice">${esc(err)}</p>` : ""}
    <input id="code" class="inp center" type="password" inputmode="text" autocomplete="current-password" placeholder="가족 비밀번호" style="font-size:1.3rem">
    <div style="height:12px"></div><button class="btn wide" onclick="doLogin()">들어가기</button></div>`;
}
async function doLogin() {
  CODE = $("#code").value.trim();
  lsSet("yd_code", CODE);
  boot();
}
function showSetup(hasData) {
  $("#tabbar").classList.add("hide");
  $("#app").innerHTML = `<div class="card" style="margin-top:8vh;max-width:520px;margin-left:auto;margin-right:auto">
    <div class="center" style="font-size:4rem">🔐</div><h2 class="center">처음 설정 (부모님)</h2>
    <p class="muted">이 용돈기입장은 인터넷 주소만 알면 열 수 있어서, <b>가족 비밀번호</b>로 잠가 둡니다.<br>태블릿·부모님 휴대폰에서 처음 한 번만 넣으면 돼요.</p>
    ${hasData ? `<p class="info">계약서 내용이 미리 들어가 있어요. 비밀번호만 정하면 바로 시작해요.</p>` : ""}
    <label class="fld"><span>가족 비밀번호 (4글자 이상)</span><input id="nc1" class="inp" type="password" autocomplete="new-password"></label>
    <label class="fld"><span>한 번 더</span><input id="nc2" class="inp" type="password" autocomplete="new-password"></label>
    <button class="btn wide" onclick="doSetup()">비밀번호 정하기</button></div>`;
}
async function doSetup() {
  const a = $("#nc1").value.trim(), b = $("#nc2").value.trim();
  if (a.length < 4) return toast("4글자 이상으로 정해 주세요");
  if (a !== b) return toast("두 비밀번호가 달라요");
  const r = await api("/api/setup", { method: "POST", body: { newCode: a } });
  if (r.status !== 200) return toast(r.data.error || "설정 실패");
  CODE = a; lsSet("yd_code", a);
  toast("설정 완료! 이 기기는 기억해 둘게요");
  boot();
}

// ---------- 렌더 ----------
function render() {
  if (!S) return;
  if (!S.profile.species) return renderChoose();
  const tabs = [["home", "🏠", "홈"], ["book", "📒", "기록장"], ["goals", "🎯", "목표"], ["bankt", "🏦", "통장"], ["contract", "📜", "계약서"]];
  const tb = $("#tabbar");
  tb.classList.remove("hide");
  tb.innerHTML = tabs.map(([k, e, n]) => `<button class="${TAB === k ? "on" : ""}" onclick="go('${k}')"><span class="e">${e}</span>${n}</button>`).join("");
  const full = (C().child || "").trim();
  const name = full ? (full.length === 3 ? full.slice(1) : full) : "나";
  const title = { home: `${esc(name)}의 용돈 친구`, book: "📒 용돈기입장", goals: "🎯 모으기 목표", bankt: "🏦 내 통장", contract: "📜 용돈 계약서" }[TAB];
  const body = { home: viewHome, book: viewBook, goals: viewGoals, bankt: viewBank, contract: viewContract }[TAB]();
  $("#app").innerHTML = `<div class="top"><h1>${title}</h1><span class="sync" id="sync"></span>
      <button class="iconbtn" title="부모님" onclick="parentEnter()">👨‍👩‍👦</button></div>${body}`;
  setSync(syncState);
  hydratePhotos($("#app"));
}
function go(t) { TAB = t; lsSet("yd_tab", t); render(); window.scrollTo(0, 0); }

// 캐릭터 고르기
let CHOOSE = "coin";
function renderChoose() {
  $("#tabbar").classList.add("hide");
  $("#app").innerHTML = `<div class="card center"><h2>나의 용돈 친구 알을 골라요!</h2>
    <p class="muted">용돈기입장을 잘 쓰면 알이 깨어나고, 쑥쑥 자라서 진화해요.</p>
    <div class="grid2" style="grid-template-columns:repeat(3,1fr)">
    ${Object.entries(SPECIES).map(([k, p]) => `<button class="tile ${CHOOSE === k ? "on" : ""}" onclick="CHOOSE='${k}';renderChoose()">
      <div style="width:100%;max-width:160px">${creatureSVG(k, 0)}</div><b>${p.label}</b><span class="small muted">${p.desc}</span></button>`).join("")}
    </div>
    <label class="fld" style="max-width:360px;margin:14px auto"><span>이름 지어 주기 (안 써도 돼요)</span>
      <input id="nick" class="inp center" maxlength="10" placeholder="${SPECIES[CHOOSE].names[1]}"></label>
    <button class="btn" onclick="chooseDone()">이 알로 할래요! 🥚</button></div>`;
}
function chooseDone() {
  const nick = ($("#nick").value || "").trim();
  const sp = CHOOSE;
  commit((st) => { st.profile.species = sp; st.profile.nickname = nick; });
  lsSet("yd_seenLv", levelInfo(S.xp).lv);
  toast("알을 받았어요! 기록을 하면 알이 따뜻해져요 🥚");
}

function charName() {
  const lv = levelInfo(S.xp).lv, st = stageOf(lv);
  const base = SPECIES[S.profile.species].names[st];
  return st === 0 ? base : S.profile.nickname || base;
}
function charSVG(opts = {}) {
  const lv = levelInfo(S.xp).lv, st = stageOf(lv);
  return creatureSVG(S.profile.species, st, { crown: S.badges.savings_open, crack: st === 0 && lv === 2, ...opts });
}
function charLine() {
  const lv = levelInfo(S.xp).lv;
  if (stageOf(lv) === 0) return CHAR_LINES.egg[Math.floor(Math.random() * CHAR_LINES.egg.length)];
  return CHAR_LINES.idle[Math.floor(Math.random() * CHAR_LINES.idle.length)];
}

// ----- 미션 -----
function missions() {
  const m = [], t = today(), cyc = curCycle();
  if (!S.xpKeys["rec:" + t]) m.push({ e: "📝", t: "오늘 기록하기", s: "돈을 썼으면 여기를 눌러요. 안 썼으면 아래 버튼!", xp: "+5", a: "spendFlow()", btn: "오늘은 안 썼어요", ba: "noSpendToday()" });
  const gotBase = txsInCycle(cyc).some((x) => x.src === "base");
  if (!gotBase && t >= payday(cyc)) m.push({ e: "💵", t: "용돈 받는 날이에요!", s: `${kdate(payday(cyc))} 용돈을 받았으면 눌러요`, xp: "+15", a: "incomeFlow('base')" });
  const prev = cyc - 1;
  if (prev >= startCycle() && !S.reviews.some((r) => r.cycle === prev)) m.push({ e: "🔍", t: "2주 돌아보기", s: "지난 2주 용돈을 돌아봐요", xp: "+20", a: `reviewFlow(${prev})` });
  if (bal("bank") >= 4000) m.push({ e: "🏦", t: "은행에 가서 통장에 넣기", s: `은행 갈 돈이 ${fmt(bal("bank"))} 모였어요`, xp: "+40", a: "bankFlow()" });
  const lastRec = S.bank.records.map((r) => r.date).sort().pop();
  if (!lastRec || daysBetween(lastRec, t) > 30) m.push({ e: "📸", t: "통장 사진 보여 주기", s: "통장 정리하고 사진을 찍으면 친구가 자라요", xp: "+30", a: "bankFlow('photo')" });
  const sp = savingsProgress();
  if (sp.ready && !S.bank.products.length) m.push({ e: "🌱", t: "적금 통장 만들 준비 완료!", s: "부모님과 은행에 가서 적금 통장을 만들어요", xp: "", a: "go('bankt')" });
  const cdays = daysBetween(t, C().end);
  if (cdays <= 30) m.push({ e: "📜", t: cdays < 0 ? "계약 기간이 끝났어요" : `계약 끝나기 ${cdays}일 전`, s: "부모님과 새 계약서를 써요", xp: "+30", a: "go('contract')" });
  else if ([3, 9].includes(new Date().getMonth() + 1) && !S.xpKeys["creview:" + t.slice(0, 7)]) m.push({ e: "📜", t: "새 학기 계약서 다시 보기", s: "약속이 잘 지켜지고 있나 같이 봐요", xp: "+10", a: "contractReviewDone()" });
  const g = S.goals.find((g) => !g.doneAt && bal("piggy") >= g.price);
  if (g) m.push({ e: g.emoji, t: `'${g.name}' 목표를 이뤘어요!`, s: "살까? 더 모을까? 골라 봐요", xp: "+50", a: `goalReached('${g.id}')` });
  return m;
}

function viewHome() {
  const L = levelInfo(S.xp), st = stageOf(L.lv);
  const pct = L.max ? 100 : Math.round((L.cur / L.need) * 100);
  const nextEvo = STAGE_AT.find((x) => x > L.lv);
  const unread = unreadPraises();
  const ms = missions();
  return `
  ${!S.startSetAt ? `<button class="startban" onclick="startMoney()"><span class="e">👛</span><div class="grow"><b>처음 시작! 지금 가진 돈을 넣어 주세요</b><div class="small">소비·경조사·저금통·은행 갈 돈·기부에 남은 돈 + 통장 잔액</div></div><span class="xp">+20</span></button>` : ""}
  ${vaultCard()}
  <div class="card">
    <div class="hero">
      <div class="charbox" id="charbox" onclick="tapChar()">${charSVG()}</div>
      <div>
        <div class="bubble" id="bubble">${esc(charLine())}</div>
        <div class="lvrow"><span class="lv">Lv.${L.lv}</span><b class="jua" style="font-size:1.25rem">${esc(charName())}</b>
          <button class="chip" style="margin-left:auto;padding:6px 10px" onclick="dexModal()">도감·배지</button></div>
        <div class="xpbar"><i style="width:${pct}%"></i></div>
        <div class="small muted">${L.max ? "최고 레벨! 명예의 전당에 올랐어요 👑" : `다음 레벨까지 ${L.need - L.cur} XP${nextEvo ? ` · Lv.${nextEvo}에 ${st === 0 ? "알이 깨어나요!" : "진화해요!"}` : ""}`}</div>
        ${unread.length ? `<button class="mission" style="margin-top:10px" onclick="showUnreadPraise(true)"><span class="e">💌</span><div><b>부모님 칭찬 편지가 왔어요!</b></div></button>` : ""}
      </div>
    </div>
  </div>
  <div class="jars" style="margin-bottom:14px">${JARS.map((j) => `<div class="jar" style="--c:${j.c}"><div class="ic">${j.icon}</div><div class="nm">${j.name}</div><div class="amt num">${fmt(bal(j.k))}</div><div class="ds">${j.ds}</div></div>`).join("")}</div>
  <div class="bigbtns" style="margin-bottom:14px">
    <button class="big hl" onclick="incomeFlow()"><span class="e">💵</span>용돈 받았어요</button>
    <button class="big" onclick="spendFlow()"><span class="e">🛍️</span>돈 썼어요</button>
    <button class="big" onclick="bankFlow()"><span class="e">🏦</span>은행 다녀왔어요</button>
    <button class="big" onclick="reviewFlow(${Math.max(startCycle(), curCycle() - 1)})"><span class="e">🔍</span>돌아보기</button>
  </div>
  <div class="card"><h2>오늘의 미션</h2>
    ${ms.length ? ms.map((x) => `<div class="mission" role="button" onclick="${x.a}"><span class="e">${x.e}</span><div class="grow"><b>${esc(x.t)}</b><div class="small muted">${esc(x.s)}</div>
      ${x.btn ? `<button class="chip" style="margin-top:6px" onclick="event.stopPropagation();${x.ba}">${x.btn}</button>` : ""}</div>${x.xp ? `<span class="xp">${x.xp}</span>` : ""}</div>`).join("") : `<p class="muted center">오늘 미션 끝! 정말 잘했어요 🌟</p>`}
    <p class="small muted center" style="margin:6px 0 0">다음 용돈날: <b>${kdate(payday(curCycle() + 1))}</b> · 이번 2주 기록한 날 <b>${countRecDaysInCycle(curCycle())}/${C().cycleDays || 14}</b></p>
  </div>`;
}
function countRecDaysInCycle(i) {
  const a = payday(i), b = payday(i + 1);
  return Object.keys(S.xpKeys).filter((k) => k.startsWith("rec:") && k.slice(4) >= a && k.slice(4) < b).length;
}
function tapChar() {
  const box = $("#charbox"); if (!box) return;
  box.classList.remove("jump"); void box.offsetWidth; box.classList.add("jump");
  $("#bubble").textContent = charLine();
}
function noSpendToday() {
  const t = today();
  commit((st) => { st.noSpend[t] = 1; recordToday(st, t); });
  toast("오늘은 돈을 안 썼군요! 기록 완료 ✅");
}

// ---------- 지금 가진 돈 (처음 시작 / 다시 맞추기) ----------
let F = {};
const START_HINT = {
  spend: "지갑이나 소비 저금통에 남아 있는 쓸 돈",
  gift: "선물·축하용으로 모아 둔 돈",
  piggy: "집 저금통에 모아 둔 돈 (목표 물건용)",
  bank: "아직 은행에 안 넣은 현금이에요. <b>통장 안에 있는 돈은 다음에 따로</b> 넣어요!",
  give: "기부하려고 모아 둔 돈",
};
function startMoney() {
  F = { jar: 0, vals: Object.fromEntries(JK.map((k) => [k, Math.max(0, bal(k))])) };
  openModal("");
  renderStartMoney();
}
function renderStartMoney() {
  if (F.jar >= JARS.length) return renderStartSummary();
  const j = JARS[F.jar];
  setModal(`${head("지금 가진 돈 알려 주기 👛")}
    <div class="step">${F.jar + 1} / ${JARS.length + 1}</div>
    <p style="font-size:1.2rem;margin:4px 0">${j.icon} <b class="jua">${j.name}</b>에 지금 얼마 있어요?</p>
    <p class="small muted" style="margin:0 0 10px">${START_HINT[j.k]}</p>
    ${keypad(F.vals[j.k], Infinity, (v) => (F.vals[j.k] = v))}
    <div class="row" style="margin-top:14px">${F.jar > 0 ? `<button class="btn sec" onclick="F.jar--;renderStartMoney()">이전</button>` : ""}
    <button class="btn wide grow" onclick="F.jar++;renderStartMoney()">다음</button></div>`);
}
function renderStartSummary() {
  const sum = JK.reduce((a, k) => a + F.vals[k], 0);
  const hasBank = S.bank.records.length > 0;
  setModal(`${head("지금 가진 돈 확인 ✅")}
    <div class="step">${JARS.length + 1} / ${JARS.length + 1}</div>
    <div class="split" style="margin-bottom:10px">${JARS.map((j, i) => `<button class="jar" style="--c:${j.c}" onclick="F.jar=${i};renderStartMoney()"><div class="ic">${j.icon}</div><div class="nm">${j.name}</div><div class="amt num">${fmt(F.vals[j.k])}</div><div class="ds">고치려면 눌러요</div></button>`).join("")}</div>
    <p class="center jua" style="font-size:1.2rem">저금통 5개 합계 ${fmt(sum)}</p>
    <div class="info">🏦 <b>통장 안에 있는 돈</b>도 넣어요. 통장 정리를 하고 사진을 찍으면 AI가 잔액(그리고 이자!)을 읽어 줘요.
      ${hasBank ? `<br>지금 기록된 통장 잔액: <b>${fmt(bankEstimate("main").est)}</b>` : ""}</div>
    <div style="height:12px"></div>
    <button class="btn blue wide" onclick="startMoneySave('photo')">📸 저장하고 통장 사진 올리기</button>
    <div style="height:10px"></div>
    <div class="grid2"><button class="btn sec" onclick="startMoneySave('manual')">✍️ 통장 잔액 직접 넣기</button>
      <button class="btn sec" onclick="startMoneySave()">${hasBank ? "저장만 할래요" : "통장은 나중에"}</button></div>`);
}
function startMoneySave(next) {
  const vals = F.vals, t = today(), now = new Date().toISOString();
  commit((st) => {
    for (const k of JK) {
      const cur = st.txs.filter((x) => x.jar === k).reduce((a, x) => a + x.amount, 0);
      const d = vals[k] - cur;
      if (d) st.txs.push({ id: uid(), at: now, date: t, kind: "adjust", jar: k, amount: d, cat: st.startSetAt ? "잔액 맞추기" : "처음 잔액", memo: st.startSetAt ? "가진 돈 다시 맞춤" : "시작할 때 가진 돈" });
    }
    if (!st.startSetAt) { st.startSetAt = t; addXP(st, "start", 20, "처음 가진 돈 넣기"); }
  });
  if (next) return bankFlow(next);
  closeModal();
  toast("좋아요! 이제부터 같이 기록해요 📒");
}

// ---------- 용돈 받기 ----------
function incomeFlow(type) {
  F = { type: type || null, amount: 0, who: "", why: "", chore: null };
  if (type === "base") { F.amount = C().base; return incomeSplit(); }
  renderIncome1();
}
function renderIncome1() {
  const c = C();
  const html = `${head("용돈 받았어요 💵")}
    <div class="step">1. 어떤 돈이에요?</div>
    <div class="tiles" style="grid-template-columns:repeat(3,1fr)">
      <button class="tile" onclick="F.type='base';F.amount=${c.base};incomeSplit()"><span class="e">📅</span>기본 용돈<span class="small muted">${fmt(c.base)} · 2주마다</span></button>
      <button class="tile" onclick="F.type='special';renderIncomeAmount()"><span class="e">🧧</span>특별 용돈<span class="small muted">세뱃돈·생일·선물</span></button>
      <button class="tile" onclick="F.type='chore';renderChore()"><span class="e">🧹</span>노력 용돈<span class="small muted">용돈 메뉴판 일</span></button>
    </div>`;
  openModal(html);
}
function renderIncomeAmount() {
  const whos = ["할머니·할아버지", "친척", "부모님", "선생님", "기타"], whys = ["세뱃돈", "생일", "칭찬", "명절", "기타"];
  setModal(`${head("특별 용돈 🧧", "renderIncome1()")}
    <div class="step">2. 얼마 받았어요?</div>
    ${keypad(F.amount, Infinity, (v) => (F.amount = v))}
    <div class="step" style="margin-top:14px">누가 줬어요?</div>
    <div class="chips" id="whos">${whos.map((w) => `<button class="chip ${F.who === w ? "on" : ""}" onclick="F.who='${w}';pickChip(this)">${w}</button>`).join("")}</div>
    <div class="step" style="margin-top:10px">왜 받았어요?</div>
    <div class="chips">${whys.map((w) => `<button class="chip ${F.why === w ? "on" : ""}" onclick="F.why='${w}';pickChip(this)">${w}</button>`).join("")}</div>
    <div style="height:14px"></div><button class="btn wide" onclick="if(!F.amount)return toast('금액을 눌러 주세요');incomeSplit()">다음: 저금통에 나누기</button>`);
}
function pickChip(el) { el.parentElement.querySelectorAll(".chip").forEach((c) => c.classList.remove("on")); el.classList.add("on"); }
function renderChore() {
  setModal(`${head("노력 용돈 🧹", "renderIncome1()")}
    <div class="step">용돈 메뉴판에서 한 일을 골라요</div>
    <div class="tiles" style="grid-template-columns:repeat(3,1fr)">${S.menu.map((m) => `<button class="tile" onclick="F.chore='${m.id}';F.amount=${m.price};F.why='${esc(m.name)}';incomeSplit()"><span class="e">${m.emoji || "⭐"}</span>${esc(m.name)}<span class="small muted">${fmt(m.price)}</span></button>`).join("")}</div>
    ${S.menu.length ? "" : `<p class="muted">아직 메뉴판이 비어 있어요. 부모님께 메뉴판을 만들어 달라고 해요!</p>`}
    <p class="small muted">계약서 약속: 더 많은 돈을 벌고 싶을 땐 메뉴판의 일을 하고 노력 용돈을 벌어요.</p>`);
}
function incomeSplit() {
  const rules = F.type === "base" ? C().baseSplit : F.type === "chore" ? C().choreSplit : C().specialSplit;
  F.split = computeSplit(F.amount, rules);
  F.planned = { ...F.split };
  if (!document.querySelector(".modal")) openModal("");
  renderSplit();
}
function renderSplit() {
  const sum = JK.reduce((a, k) => a + F.split[k], 0), left = F.amount - sum;
  const label = F.type === "base" ? "기본 용돈" : F.type === "chore" ? "노력 용돈" : "특별 용돈";
  const already = F.type === "base" && txsInCycle(curCycle()).some((x) => x.src === "base");
  setModal(`${head(`${label} ${fmt(F.amount)}`, F.type === "base" ? "" : F.type === "chore" ? "renderChore()" : "renderIncomeAmount()")}
    ${already ? `<p class="notice">이번 2주 기본 용돈은 이미 기록했어요. 또 받았다면 그대로 진행해요.</p>` : ""}
    <div class="step">계약서대로 저금통에 나눠요 ${F.type === "special" && C().specialSplit.piggy.t === "pct" ? `(저금통 ${C().specialSplit.piggy.v}% = ${fmt(F.planned.piggy)})` : ""}</div>
    <div class="split">${JARS.map((j) => `<div class="jar" style="--c:${j.c}"><div class="ic">${j.icon}</div><div class="nm">${j.name}</div>
      <div class="amt num">${fmt(F.split[j.k])}</div>
      <div class="adj"><button onclick="splitAdj('${j.k}',-100)">－</button><button onclick="splitAdj('${j.k}',100)">＋</button></div></div>`).join("")}</div>
    <p class="center ${left ? "minus" : "muted"}" style="font-family:Jua;font-size:1.1rem">${left > 0 ? `아직 ${fmt(left)} 남았어요` : left < 0 ? `${fmt(-left)} 넘쳤어요` : "딱 맞게 나눴어요 👍"}</p>
    <button class="btn wide ok" ${left ? "disabled" : ""} onclick="incomeSave()">이렇게 저금통에 넣을래요!</button>`);
}
function splitAdj(k, d) {
  const v = F.split[k] + d;
  if (v < 0) return;
  F.split[k] = v; renderSplit();
}
function incomeSave() {
  const f = { ...F, split: { ...F.split } }, t = today(), now = new Date().toISOString(), grp = uid(), cyc = curCycle();
  const asPlanned = JK.every((k) => f.split[k] === f.planned[k]);
  const label = f.type === "base" ? "기본 용돈" : f.type === "chore" ? `노력 용돈: ${f.why}` : `특별 용돈${f.why ? ": " + f.why : ""}${f.who ? " (" + f.who + ")" : ""}`;
  commit((st) => {
    for (const k of JK) if (f.split[k]) st.txs.push({ id: uid(), at: now, date: t, kind: "in", jar: k, amount: f.split[k], src: f.type, group: grp, cat: label, memo: "" });
    recordToday(st, t);
    if (f.type === "base" && asPlanned) addXP(st, "split:" + cyc, 15, "계획대로 나누기");
    if (f.type === "special" && asPlanned) addXP(st, "splitS:" + grp, 10, "특별 용돈 나누기");
    if (f.type === "chore") {
      const n = Object.keys(st.xpKeys).filter((k) => k.startsWith("chore:" + cyc + ":")).length;
      if (n < 3) addXP(st, "chore:" + cyc + ":" + n, 10, "노력 용돈");
      addBadge(st, "chore");
    }
  });
  closeModal();
  coinRain();
  toast(`${fmt(f.amount)} 저금통에 쏙! 🪙`);
}
function coinRain() {
  for (let i = 0; i < 18; i++) {
    const c = document.createElement("div");
    c.className = "confetti"; c.textContent = "🪙";
    Object.assign(c.style, { left: Math.random() * 100 + "vw", background: "none", fontSize: "28px", width: "auto", height: "auto", animationDuration: 1.2 + Math.random() * 1.2 + "s", zIndex: 90, position: "fixed" });
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 2600);
  }
}

// ---------- 돈 쓰기 ----------
function spendFlow(jar) {
  F = { jar: jar || null, amount: 0, cat: "", need: "", mood: "" };
  openModal("");
  jar ? renderSpendAmount() : renderSpend1();
}
function renderSpend1() {
  setModal(`${head("돈 썼어요 🛍️")}
    <div class="step">1. 어느 통에서 꺼냈어요?</div>
    <div class="tiles" style="grid-template-columns:repeat(2,1fr)">
      ${["spend", "gift", "give", "piggy"].map((k) => `<button class="tile" onclick="F.jar='${k}';renderSpendAmount()"><span class="e">${JAR[k].icon}</span>${JAR[k].name}<span class="small muted">${fmt(bal(k))} 있어요</span></button>`).join("")}
    </div>
    <p class="small muted center">🏦 '은행 갈 돈'은 통장에 넣는 돈이라 여기서는 못 써요.</p>`);
}
function renderSpendAmount() {
  const max = Math.max(0, bal(F.jar));
  setModal(`${head(`${JAR[F.jar].icon} ${JAR[F.jar].name}에서 썼어요`, "renderSpend1()")}
    <div class="step">2. 얼마 썼어요? <span class="muted">(${fmt(max)} 있어요)</span></div>
    ${keypad(F.amount, max, (v) => (F.amount = v))}
    ${max === 0 ? `<p class="notice">이 통에 돈이 없어요. 계약서 약속대로 돈을 빌리지 않아요. 실제로는 돈이 있다면 '돌아보기 → 잔액 맞추기'를 해요.</p>` : ""}
    <div style="height:12px"></div><button class="btn wide" onclick="if(!F.amount)return toast('금액을 눌러 주세요');renderSpendCat()">다음</button>`);
}
function renderSpendCat() {
  const q = F.jar === "give" ? "어디에 기부했어요?" : F.jar === "gift" ? "누구를 위해 썼어요?" : "무엇을 샀어요?";
  setModal(`${head(fmt(F.amount), "renderSpendAmount()")}
    <div class="step">3. ${q}</div>
    <div class="tiles">${CATS[F.jar].map(([n, e]) => `<button class="tile ${F.cat === n ? "on" : ""}" onclick="F.cat='${n}';${F.jar === "spend" || F.jar === "piggy" ? "renderSpendNeed()" : "spendSave()"}"><span class="e">${e}</span>${n}</button>`).join("")}</div>`);
}
function renderSpendNeed() {
  setModal(`${head(`${F.cat} ${fmt(F.amount)}`, "renderSpendCat()")}
    <div class="step">4. 이건 어떤 거였어요?</div>
    <div class="grid2">
      <button class="tile ${F.need === "need" ? "on" : ""}" onclick="F.need='need';renderSpendNeed()" style="padding:18px"><span class="e">✅</span>꼭 필요했어요</button>
      <button class="tile ${F.need === "want" ? "on" : ""}" onclick="F.need='want';renderSpendNeed()" style="padding:18px"><span class="e">💭</span>갖고 싶었어요</button>
    </div>
    <div class="step" style="margin-top:16px">사고 나서 기분은?</div>
    <div class="grid2" style="grid-template-columns:repeat(3,1fr)">
      ${[["good", "😊", "잘 샀어요"], ["soso", "😐", "그냥 그래요"], ["bad", "😢", "좀 아까워요"]].map(([k, e, n]) => `<button class="tile ${F.mood === k ? "on" : ""}" onclick="F.mood='${k}';renderSpendNeed()"><span class="e">${e}</span>${n}</button>`).join("")}
    </div>
    <p class="small muted center">어떤 걸 골라도 괜찮아요. 솔직하게 기록하는 게 제일 멋져요!</p>
    <button class="btn wide ok" onclick="if(!F.need)return toast('꼭 필요 / 갖고 싶어 중에 골라요');spendSave()">기록하기</button>`);
}
function spendSave() {
  const f = { ...F }, t = today(), now = new Date().toISOString(), cyc = curCycle();
  commit((st) => {
    st.txs.push({ id: uid(), at: now, date: t, kind: "out", jar: f.jar, amount: -f.amount, cat: f.cat, need: f.need || "", mood: f.mood || "", memo: "" });
    recordToday(st, t);
    if (f.jar === "give") { addXP(st, "give:" + cyc, 30, "기부하기"); addBadge(st, "first_give"); }
  });
  closeModal();
  toast(f.jar === "give" ? "기부 기록 완료! 마음이 따뜻해져요 💝" : "기록 완료! 📝");
}

// ---------- 은행 ----------
function bankFlow(mode) {
  F = { mode: mode || null, amount: bal("bank"), to: "main", with: "", photo: null, small: null, ocr: null, rows: [], balance: 0, account: "main" };
  openModal("");
  mode === "photo" ? renderBankPhoto() : mode === "manual" ? renderBankManual() : renderBank1();
}
function renderBank1() {
  setModal(`${head("은행 다녀왔어요 🏦")}
    <div class="step">무엇을 했어요?</div>
    <div class="grid2">
      <button class="tile" style="padding:18px" onclick="F.mode='deposit';renderDeposit()"><span class="e">💰</span>통장에 돈 넣었어요<span class="small muted">은행 갈 돈 ${fmt(bal("bank"))}</span></button>
      <button class="tile" style="padding:18px" onclick="F.mode='photo';renderBankPhoto()"><span class="e">📸</span>통장 사진만 올릴래요<span class="small muted">통장 정리 후 사진</span></button>
    </div>
    <button class="btn sec wide" style="margin-top:10px" onclick="F.mode='manual';renderBankManual()">✍️ 사진 없이 통장 잔액만 넣기</button>
    <div class="info" style="margin-top:12px">💡 <b>은행 미션</b>: ① 부모님이랑 창구에서 입금 → ② ATM에서 통장 정리 → ③ 혼자 입금 도전! (출금은 꼭 부모님이랑)</div>`);
}
function accChips(field) {
  const accs = bankAccounts();
  return accs.length > 1 ? `<div class="chips" style="margin:8px 0">${accs.map((a) => `<button class="chip ${F[field] === a.id ? "on" : ""}" onclick="F.${field}='${a.id}';pickChip(this)">${esc(a.name)}</button>`).join("")}</div>` : "";
}
function renderBankManual() {
  F.balance = F.balance || Math.max(0, bankEstimate(F.account).est);
  setModal(`${head("통장 잔액 넣기 ✍️", "renderBank1()")}
    <p>통장 마지막 줄에 찍힌 <b>잔액</b>을 눌러서 넣어요.</p>
    ${accChips("account")}
    ${keypad(F.balance, Infinity, (v) => (F.balance = v))}
    <p class="small muted center">사진을 올리면 AI가 이자도 찾아 주고, 캐릭터도 +30 XP 자라요!</p>
    <div class="grid2"><button class="btn sec" onclick="F.mode='photo';renderBankPhoto()">📸 사진으로 할래요</button>
      <button class="btn ok" onclick="bankSave()">이 잔액으로 저장</button></div>`);
}
function renderDeposit() {
  setModal(`${head("통장에 넣었어요 💰", "renderBank1()")}
    <div class="step">얼마 넣었어요? <span class="muted">(은행 갈 돈 ${fmt(bal("bank"))})</span></div>
    ${keypad(F.amount, Math.max(0, bal("bank")), (v) => (F.amount = v))}
    ${bankAccounts().length > 1 ? `<div class="step" style="margin-top:12px">어느 통장에 넣었어요?</div>${accChips("to")}` : ""}
    <div class="step" style="margin-top:12px">누구랑 갔어요?</div>
    <div class="chips"><button class="chip ${F.with === "parent" ? "on" : ""}" onclick="F.with='parent';pickChip(this)">👨‍👩‍👦 부모님이랑</button>
      <button class="chip ${F.with === "solo" ? "on" : ""}" onclick="F.with='solo';pickChip(this)">🦸 혼자 갔어요! <span class="xp">+30</span></button></div>
    <div style="height:14px"></div>
    <div class="grid2">
      <button class="btn blue" onclick="if(!F.amount)return toast('금액을 눌러 주세요');F.account=F.to;renderBankPhoto()">📸 통장 사진도 찍을래요</button>
      <button class="btn sec" onclick="if(!F.amount)return toast('금액을 눌러 주세요');bankSave()">사진 없이 저장</button>
    </div>`);
}
function renderBankPhoto() {
  setModal(`${head("통장 사진 📸", F.mode === "deposit" ? "renderDeposit()" : "renderBank1()")}
    <p>ATM에서 <b>통장 정리</b>를 하고, 거래 줄들과 마지막 줄 <b>잔액</b>이 잘 보이게 찍어요.</p>
    <p class="small muted">💡 여러 쪽이면 한 쪽씩 따로 올려도 돼요. AI가 <b>이자</b> 줄도 찾아 줘요!</p>
    <p class="notice">🔒 계좌번호는 손가락이나 종이로 가리고 찍어요!</p>
    ${bankAccounts().length > 1 ? `<div class="step">어느 통장 사진이에요?</div>` : ""}${accChips("account")}
    ${F.mode !== "deposit" ? `<div class="step" style="margin-top:8px">누구랑 은행에 갔어요?</div>
    <div class="chips" style="margin-bottom:10px"><button class="chip ${F.with === "parent" ? "on" : ""}" onclick="F.with='parent';pickChip(this)">👨‍👩‍👦 부모님이랑</button>
      <button class="chip ${F.with === "solo" ? "on" : ""}" onclick="F.with='solo';pickChip(this)">🦸 혼자 갔어요! <span class="xp">+30</span></button></div>` : ""}
    <label class="btn blue wide" style="display:block;text-align:center">📷 사진 찍기 / 고르기
      <input type="file" accept="image/*" capture="environment" style="display:none" onchange="bankPhotoPicked(this.files[0])"></label>
    <div id="photoArea" style="margin-top:12px"></div>`);
}
async function compressImage(file, maxSide, q) {
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); });
  const k = Math.min(1, maxSide / Math.max(img.width, img.height));
  const cv = document.createElement("canvas");
  cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
  cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
  return cv.toDataURL("image/jpeg", q);
}
// 적요는 정해진 낱말로만 남긴다 (이름·가게 이름이 저장되지 않게)
function descWord(d, dep, isInt) {
  d = String(d || "");
  if (isInt || /이자|결산/.test(d)) return "이자";
  for (const w of ["현금입금", "입금", "출금", "이체", "카드", "자동이체", "수수료", "세금"]) if (d.includes(w)) return w;
  return dep > 0 ? "입금" : "출금";
}
function cleanRows(rows) {
  return (rows || []).slice(0, 40).map((x) => ({
    d: /^\d{4}-\d{2}-\d{2}$/.test(x.date || "") ? x.date : "",
    t: descWord(x.desc, x.deposit, x.is_interest),
    in: Math.max(0, Math.round(x.deposit || 0)), out: Math.max(0, Math.round(x.withdraw || 0)),
    bal: Math.round(x.balance || 0), int: !!x.is_interest && (x.deposit || 0) > 0,
  })).filter((x) => x.in || x.out || x.bal);
}
async function bankPhotoPicked(file) {
  if (!file) return;
  const area = $("#photoArea");
  area.innerHTML = `<p class="center">사진 준비 중… 📷</p>`;
  try {
    F.photo = await compressImage(file, 1568, 0.85);
    F.small = await compressImage(file, 900, 0.7);
  } catch { area.innerHTML = `<p class="notice">사진을 열 수 없어요. 다시 찍어 볼까요?</p>`; return; }
  area.innerHTML = `<img class="photo-prev" src="${F.small}"><div class="center" style="margin:14px 0;font-family:Jua;font-size:1.2rem">🤖 AI가 통장을 읽고 있어요… 잔액과 이자를 찾는 중 <span class="twinkle">✨</span></div>`;
  const r = await api("/api/ocr", { method: "POST", body: { dataUrl: F.photo } }).catch(() => ({ status: 0, data: {} }));
  F.ocr = r.status === 200 ? r.data : null;
  F.rows = F.ocr ? cleanRows(F.ocr.rows) : [];
  F.balance = F.ocr && F.ocr.found ? F.ocr.balance : bankEstimate(F.account).est + (F.mode === "deposit" && F.to === F.account ? F.amount : 0);
  renderBankConfirm(r.status === 200 ? null : r.data.error || "AI 읽기에 실패했어요.");
}
function rowToggleInt(i) { const x = F.rows[i]; if (x && x.in > 0) { x.int = !x.int; renderBankConfirm(); } }
function renderBankConfirm(err) {
  const o = F.ocr;
  if (err !== undefined) F.err = err;
  const exp = bankEstimate(F.account).est + (F.mode === "deposit" && F.to === F.account ? F.amount : 0);
  const known = new Set(bankRows(F.account).map(rowKey));
  const ints = F.rows.filter((x) => x.int);
  const newInts = ints.filter((x) => !known.has(rowKey(x)));
  setModal(`${head("통장 잔액 확인 ✅", "renderBankPhoto()")}
    <img class="photo-prev" src="${F.small}" style="max-height:200px">
    ${F.err ? `<p class="notice">${esc(F.err)}</p>` : o && o.found ? `<p class="info">🤖 ${esc(o.note_ko || "잔액을 읽었어요!")}${o.confidence !== "high" ? " (조금 흐려요. 숫자를 꼭 확인해요)" : ""}</p>` : `<p class="notice">🤖 ${esc((o && o.note_ko) || "잔액을 못 찾았어요.")} 직접 눌러서 넣어요.</p>`}
    ${ints.length ? `<div class="intfound"><div class="jua" style="font-size:1.2rem">🎁 이자를 찾았어요!</div>
      ${ints.map((x) => `<div>${x.d ? kdate(x.d) : "날짜 모름"} · 은행이 준 이자 <b>${fmt(x.in)}</b>${known.has(rowKey(x)) ? ` <span class="small muted">(전에 찾은 이자)</span>` : " ✨"}</div>`).join("")}</div>` : ""}
    ${F.rows.length ? `<details class="rows"><summary>📒 AI가 읽은 거래 ${F.rows.length}줄 보기 (이자 표시를 고칠 수 있어요)</summary>
      <table><tr><th>날짜</th><th>내용</th><th>넣은 돈</th><th>뺀 돈</th><th>잔액</th><th></th></tr>
      ${F.rows.map((x, i) => `<tr class="${x.int ? "int" : ""}"><td>${x.d ? x.d.slice(5).replace("-", "/") : "-"}</td><td>${esc(x.t)}</td><td>${x.in ? fmt(x.in) : ""}</td><td>${x.out ? fmt(x.out) : ""}</td><td>${fmt(x.bal)}</td>
        <td>${x.in ? `<button class="chip ${x.int ? "on" : ""}" style="padding:4px 8px;font-size:.8rem" onclick="rowToggleInt(${i})">🎁이자</button>` : ""}</td></tr>`).join("")}</table></details>` : ""}
    <div class="step" style="margin-top:10px">통장에 찍힌 마지막 잔액이 맞나요? (틀리면 키패드로 고쳐요)</div>
    ${keypad(F.balance, Infinity, (v) => (F.balance = v))}
    ${S.bank.records.length || exp ? `<p class="small muted center">앱에서 계산한 예상 잔액: ${fmt(exp)}</p>` : ""}
    <button class="btn wide ok" onclick="bankSave()">이 잔액으로 저장! 🐣 먹이 주기${newInts.length ? " + 🎁" : ""}</button>`);
}
async function bankSave() {
  const f = { ...F }, t = today(), now = new Date().toISOString(), cyc = curCycle();
  let photoId = null;
  if (f.small) {
    const r = await api("/api/photo", { method: "POST", body: { dataUrl: f.small } }).catch(() => null);
    if (r && r.status === 200) { photoId = r.data.id; PHOTO_CACHE[photoId] = f.small; }
  }
  const recId = uid(), hasRecord = !!f.small || f.mode === "manual";
  const known = new Set(bankRows(f.account).map(rowKey));
  const newInts = (f.rows || []).filter((x) => x.int && !known.has(rowKey(x)));
  commit((st) => {
    if (f.mode === "deposit" && f.amount) {
      st.txs.push({ id: uid(), at: now, date: t, kind: "deposit", jar: "bank", amount: -f.amount, to: f.to, cat: "통장 입금", memo: f.with === "solo" ? "혼자 입금" : f.with === "parent" ? "부모님과 입금" : "" });
      const n = Object.keys(st.xpKeys).filter((k) => k.startsWith("dep:" + cyc + ":")).length;
      if (n < 2) addXP(st, "dep:" + cyc + ":" + n, 40, "은행 입금");
      addBadge(st, "first_deposit");
      if (st.txs.filter((x) => x.kind === "deposit").length >= 6) addBadge(st, "deposit6");
    }
    if (hasRecord) {
      st.bank.records.push({ id: recId, at: new Date(Date.now() + 1000).toISOString(), date: t, account: f.account, balance: f.balance, ai: f.ocr && f.ocr.found ? f.ocr.balance : null, photoId, rows: f.rows || [], parentOk: false });
      if (f.small) { addXP(st, "photo:" + cyc, 30, "통장 사진"); addBadge(st, "first_photo"); }
      checkBankBadges(st, f.balance);
    }
    if (f.with === "solo" && (f.mode === "deposit" || f.small)) {
      const n = Object.keys(st.xpKeys).filter((k) => k.startsWith("solo:" + cyc + ":")).length;
      if (n < 2) addXP(st, "solo:" + cyc + ":" + n, 30, "혼자 은행 다녀오기");
      addBadge(st, "solo_deposit");
    }
    newInts.slice(0, 3).forEach((x) => addXP(st, "int:" + rowKey(x), 20, "이자 발견"));
    if (newInts.length) addBadge(st, "first_interest");
    recordToday(st, t);
    const sp = (() => { const dc = st.txs.filter((x) => x.kind === "deposit").length; return dc >= st.savingsRule.deposits && f.balance >= st.savingsRule.minBalance; })();
    if (sp) addBadge(st, "savings_ready");
  });
  const newIntSum = newInts.reduce((a, x) => a + x.in, 0);
  closeModal();
  if (f.small || newIntSum) fedAnimation(newIntSum);
  else if (f.mode === "manual") toast(`통장 잔액 ${fmt(f.balance)} 저장했어요 🏦`);
  else toast("입금 기록 완료! 은행에 다녀온 거 정말 멋져요 🏦");
}
function fedAnimation(newInt) {
  const line = CHAR_LINES.fed[Math.floor(Math.random() * CHAR_LINES.fed.length)];
  openModal(`<div class="center"><div style="width:min(60vw,260px);margin:0 auto" class="jump">${charSVG({ happy: true })}</div>
    <h2>${esc(line)}</h2><p class="muted">통장 사진을 보여 줘서 ${esc(jo(charName(), "이", "가"))} 쑥 자랐어요!</p>
    ${newInt ? `<div class="intfound" style="text-align:center"><div class="jua" style="font-size:1.3rem">🎁 은행이 이자 ${fmt(newInt)}을 줬어요!</div>
      <div class="small">돈을 은행에 맡겨 두었더니, 은행이 고맙다고 준 선물이에요. 오래 맡길수록 더 많아져요!</div></div>` : ""}
    <button class="btn" onclick="closeModal()">좋아요!</button></div>`);
  coinRain();
}

// ---------- 은행 저금 단계 · 원금과 이자 ----------
const TIERS = [
  { min: 0, name: "새싹 통장", e: "🌱", say: "작은 씨앗이 통장에 심어졌어요" },
  { min: 1000000, name: "동전 통장", e: "🪙", say: "100만 원! 동전이 차곡차곡 쌓였어요" },
  { min: 2000000, name: "은빛 통장", e: "🥈", say: "200만 원! 통장이 은빛으로 반짝여요" },
  { min: 3000000, name: "황금 통장", e: "🥇", say: "300만 원! 통장이 황금빛이 됐어요" },
  { min: 4000000, name: "다이아 통장", e: "💎", say: "400만 원! 다이아몬드처럼 빛나요" },
  { min: 5000000, name: "왕관 통장", e: "👑", say: "500만 원! 저축왕의 왕관을 썼어요" },
  { min: 6000000, name: "용의 보물 통장", e: "🐉", say: "600만 원! 용이 지키는 보물이 됐어요" },
  { min: 7000000, name: "무지개 통장", e: "🌈", say: "700만 원! 무지개가 떴어요" },
  { min: 8000000, name: "은하수 통장", e: "🌌", say: "800만 원! 별처럼 반짝이는 통장이에요" },
  { min: 9000000, name: "태양 통장", e: "☀️", say: "900만 원! 태양처럼 눈부셔요" },
  { min: 10000000, name: "우주 최강 통장", e: "🚀", say: "1,000만 원! 우주 최강 저축가예요" },
];
function tierOf(v) { let i = 0; TIERS.forEach((t, k) => { if (v >= t.min) i = k; }); return i; }
function bankTotal() { return bankAccounts().reduce((a, x) => a + Math.max(0, bankEstimate(x.id).est), 0); }
function rowKey(x) { return [x.d, x.in, x.out, x.bal].join("|"); }
function bankRows(acc) {
  const map = new Map();
  const recs = S.bank.records.filter((r) => (r.account || "main") === acc).sort((a, b) => (a.at < b.at ? -1 : 1));
  for (const r of recs) for (const x of r.rows || []) map.set(rowKey(x), x); // 나중 기록(고친 표시)이 이김
  return [...map.values()].sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0));
}
function interestInfo(acc) {
  const accs = acc ? [acc] : bankAccounts().map((a) => a.id);
  let interest = 0, balSum = 0; const ints = [];
  for (const id of accs) {
    bankRows(id).filter((x) => x.int).forEach((x) => { interest += x.in; ints.push({ ...x, acc: id }); });
    balSum += Math.max(0, bankEstimate(id).est);
  }
  ints.sort((a, b) => (a.d < b.d ? 1 : -1));
  return { interest, ints, bal: balSum, principal: Math.max(0, balSum - interest) };
}
function coinArt(i) {
  const metal = i <= 1 ? ["#F2B26B", "#C97A35"] : i === 2 ? ["#EEF1F6", "#A9B3C2"] : ["#FFD84D", "#E0A100"];
  const stacks = Math.min(5, 1 + Math.ceil(i * 0.6)), total = 3 + i * 4;
  let g = "", left = total;
  const gap = 200 / (stacks + 1);
  for (let s = 0; s < stacks; s++) {
    const n = Math.max(1, Math.min(11, Math.round(left / (stacks - s)) - (s % 2))); left -= n;
    const x = gap * (s + 1);
    for (let c = 0; c < n; c++) {
      const y = 128 - c * 8;
      g += `<ellipse cx="${x}" cy="${y + 3}" rx="19" ry="6.5" fill="${metal[1]}"/><ellipse cx="${x}" cy="${y}" rx="19" ry="6.5" fill="${metal[0]}" stroke="${metal[1]}" stroke-width="1"/>`;
    }
  }
  if (i >= 4) g += `<g transform="translate(100 ${i >= 5 ? 44 : 30})"><polygon points="-16,-6 -8,-16 8,-16 16,-6 0,16" fill="#9EE7FF" stroke="#3FB7E8" stroke-width="2"/><polygon points="-8,-16 0,-6 8,-16" fill="#D8F6FF"/><line x1="-16" y1="-6" x2="16" y2="-6" stroke="#3FB7E8" stroke-width="1.5"/></g>`;
  if (i >= 5) g += `<g transform="translate(100 16)"><path d="M-22 10 L-22 -6 L-11 3 L0 -12 L11 3 L22 -6 L22 10 Z" fill="#FFD84D" stroke="#C98A00" stroke-width="2"/><circle cx="0" cy="-12" r="3" fill="#FF6FA5"/></g>`;
  if (i >= 6) g += `<text x="22" y="40" font-size="20">⭐</text><text x="160" y="30" font-size="16">⭐</text>`;
  if (i >= 8) g += `<circle cx="172" cy="70" r="11" fill="#FFB86B"/><ellipse cx="172" cy="70" rx="19" ry="5" fill="none" stroke="#FFE7A0" stroke-width="2.5"/>`;
  if (i >= 10) g += `<text x="10" y="90" font-size="24">🚀</text>`;
  return `<svg viewBox="0 0 200 140" class="${i >= 3 ? "bob" : ""}" style="transform-origin:100px 130px">${g}</svg>`;
}
function vaultCard(big) {
  const tot = bankTotal(), i = tierOf(tot), T = TIERS[i], N = TIERS[i + 1];
  const ii = interestInfo();
  const pct = N ? Math.round(((tot - T.min) / (N.min - T.min)) * 100) : 100;
  const spark = Array.from({ length: Math.min(12, i * 2) }, (_, k) => `<span class="spk" style="left:${(k * 37 + 11) % 92}%;top:${(k * 53 + 7) % 80}%;animation-delay:${(k % 5) * 0.3}s">✨</span>`).join("");
  const waiting = bal("bank");
  return `<div class="vault t${i}${big ? " big" : ""}" ${big ? "" : `onclick="go('bankt')" role="button"`}>${spark}
    <div class="vleft">
      <div class="vtier">${T.e} ${T.name}</div>
      <div class="small vlab">은행에 모은 돈${bankAccounts().length > 1 ? ` (통장 ${bankAccounts().length}개 합계)` : ""}</div>
      <div class="vamt num">${fmt(tot)}</div>
      ${ii.interest ? `<div class="vint">🎁 은행이 준 이자 ${fmt(ii.interest)}</div>` : ""}
      ${N ? `<div class="vprog"><i style="width:${Math.max(3, pct)}%"></i></div><div class="small vlab">다음 '${N.e} ${N.name}'까지 ${fmt(N.min - tot)}</div>` : `<div class="small vlab">최고 단계 달성! 🏆</div>`}
      ${waiting > 0 ? `<div class="small vlab">🏦 은행 갈 돈 ${fmt(waiting)}이 기다리고 있어요</div>` : ""}
    </div>
    <div class="vart">${coinArt(i)}</div></div>`;
}
// 통장 단계는 한 단계씩 차례로 축하한다 (0→270만 원이면 동전 통장 → 은빛 통장 두 번)
// 본 단계는 서버에 저장해서, 부모님 폰에서 넣어도 아이 태블릿에서 축하가 나온다.
function checkTierUp() {
  if (!S || !S.profile.species || isParentDevice()) return false;
  const cur = tierOf(bankTotal()), seen = S.tierSeen || 0;
  if (cur <= seen || document.querySelector(".celebrate") || document.querySelector(".modal")) return false;
  const nx = seen + 1, T = TIERS[nx], last = nx === cur, steps = cur - seen;
  const el = document.createElement("div");
  el.className = "celebrate";
  el.innerHTML = `${steps > 1 || nx > 1 ? `<div class="jua" style="font-size:1.1rem;background:#fff;border-radius:99px;padding:4px 14px;margin-bottom:8px">통장 레벨 업! ${nx}단계${!last ? ` · 아직 ${steps - 1}번 더 남았어요!` : ""}</div>` : ""}
    <div class="vault t${nx}" style="width:min(88vw,440px);pointer-events:none;text-align:left"><div class="vleft"><div class="vtier">${T.e} ${T.name}</div><div class="vamt num">${last ? fmt(bankTotal()) : fmt(T.min) + " 돌파"}</div></div><div class="vart">${coinArt(nx)}</div></div>
    <h1>통장이 업그레이드됐어요!</h1><p style="font-size:1.2rem">${T.e} <b>${T.name}</b><br>${T.say}</p>
    <button class="btn" onclick="this.closest('.celebrate').remove();render();setTimeout(checkLevelUp,400)">${last ? "멋져요! 🎉" : "다음 단계도 보기 ▶"}</button>`;
  document.body.appendChild(el);
  commit((st) => { st.tierSeen = Math.max(st.tierSeen || 0, nx); }); // 축하 화면이 떠 있어서 다음 단계는 닫은 뒤에 나옴
  confetti(el); coinRain();
  return true;
}
function interestCard() {
  const ii = interestInfo(), b = ii.bal;
  const pI = b ? Math.min(100, (ii.interest / b) * 100) : 0;
  const yrLow = Math.round(b * 0.001), yrHigh = Math.round(b * 0.03);
  const rated = S.bank.products.filter((p) => p.rate);
  return `<div class="card"><h2>🎁 원금과 이자</h2>
    <div class="pibar"><i class="pp" style="width:${100 - pI}%"></i><i class="pi" style="width:${ii.interest ? Math.max(2, pI) : 0}%"></i></div>
    <div class="grid2" style="margin-top:10px">
      <div class="pibox"><div class="small">💪 내가 넣은 돈 (원금)</div><div class="jua" style="font-size:1.5rem">${fmt(ii.principal)}</div></div>
      <div class="pibox gold"><div class="small">🎁 은행이 준 선물 (이자)</div><div class="jua" style="font-size:1.5rem">${fmt(ii.interest)}</div></div>
    </div>
    <p class="small muted" style="margin:6px 2px 0">원금 = 지금 통장 돈 − 통장 사진에서 찾은 이자</p>
    ${ii.ints.length ? `<div style="margin-top:10px"><b class="jua">이자 받은 날</b>${ii.ints.slice(0, 8).map((x) => `<div class="tx"><span class="e">🎁</span><div class="grow">${x.d ? x.d.slice(0, 4) + "년 " + kdate(x.d) : "날짜 모름"}<div class="small muted">${esc(bankAccounts().find((a) => a.id === x.acc)?.name || "통장")}</div></div><span class="m plus">+${fmt(x.in)}</span></div>`).join("")}</div>`
      : `<p class="small muted">아직 통장 사진에서 이자를 못 찾았어요. 이자는 몇 달에 한 번 통장에 <b>'이자'</b>나 <b>'결산'</b>이라고 찍혀요. 통장 정리하고 사진을 올리면 AI가 찾아 줘요!</p>`}
    <div class="info" style="margin-top:10px"><b class="jua">💡 돈이 일하는 힘</b><br>
      지금 통장 돈 ${fmt(b)}을 1년 동안 맡기면 (세금 떼기 전, 예시)<br>
      · 입출금 통장 (연 0.1%쯤): 약 <b>${fmt(yrLow)}</b><br>
      · 예금·적금 (연 3%쯤): 약 <b>${fmt(yrHigh)}</b>${yrLow ? ` → 약 <b>${Math.round(yrHigh / Math.max(1, yrLow))}배</b>!` : ""}
      ${rated.map((p) => `<br>· ${esc(p.name || p.type)} (연 ${p.rate}%): 약 <b>${fmt(Math.round((bankEstimate(p.id).est * p.rate) / 100))}</b>`).join("")}
      <div class="small muted" style="margin-top:4px">그래서 돈이 모이면 적금·예금 통장을 만드는 거예요!</div></div>
  </div>`;
}

// ---------- 2주 돌아보기 ----------
function reviewFlow(cyc) {
  cyc = Math.max(startCycle(), cyc);
  const list = txsInCycle(cyc);
  F = { cyc, step: 1, best: "", change: "", promise: "", mood: "", matched: null, adj: {}, list };
  openModal("");
  renderReview();
}
function txChip(t, key) {
  return `<button class="chip ${F[key] === t.id ? "on" : ""}" onclick="F.${key}='${t.id}';pickChip(this)">${catIcon(t)} ${esc(t.cat)} ${fmt(-t.amount)}</button>`;
}
function catIcon(t) {
  if (t.kind === "in") return "💵";
  if (t.kind === "deposit") return "🏦";
  if (t.kind === "adjust") return "⚖️";
  const c = (CATS[t.jar] || []).find((x) => x[0] === t.cat);
  return c ? c[1] : JAR[t.jar]?.icon || "•";
}
function renderReview() {
  const outs = F.list.filter((t) => t.kind === "out");
  const inSum = F.list.filter((t) => t.kind === "in").reduce((a, t) => a + t.amount, 0);
  const outSum = outs.reduce((a, t) => a - t.amount, 0);
  const need = outs.filter((t) => t.need === "need").reduce((a, t) => a - t.amount, 0);
  const want = outs.filter((t) => t.need === "want").reduce((a, t) => a - t.amount, 0);
  const done = S.reviews.find((r) => r.cycle === F.cyc);
  const title = `🔍 ${kdate(payday(F.cyc))} ~ ${kdate(addDays(payday(F.cyc + 1), -1))}`;
  let body = "";
  if (F.step === 1) {
    body = `<div class="card"><div class="grid2" style="grid-template-columns:repeat(3,1fr)">
      <div class="center"><div class="muted small">받은 돈</div><div class="jua plus" style="font-size:1.3rem">${fmt(inSum)}</div></div>
      <div class="center"><div class="muted small">쓴 돈</div><div class="jua minus" style="font-size:1.3rem">${fmt(outSum)}</div></div>
      <div class="center"><div class="muted small">기록한 날</div><div class="jua" style="font-size:1.3rem">${countRecDaysInCycle(F.cyc)}일</div></div></div>
      ${outSum ? `<div style="margin-top:10px" class="small">✅ 꼭 필요 ${fmt(need)} · 💭 갖고 싶어 ${fmt(want)}</div>
      <div class="prog" style="margin-top:4px"><i style="width:${Math.round((need / (need + want || 1)) * 100)}%;background:linear-gradient(90deg,#7EDDB4,#22B07D)"></i></div>` : ""}</div>
      ${done ? `<p class="info">이 기간은 이미 돌아봤어요. 다시 해도 괜찮아요!</p>` : ""}
      <div class="step">1. 가장 잘 쓴 돈은?</div>
      <div class="chips">${outs.map((t) => txChip(t, "best")).join("")}<button class="chip ${F.best === "none" ? "on" : ""}" onclick="F.best='none';pickChip(this)">${outs.length ? "고르기 어려워요" : "쓴 돈이 없어요"}</button></div>
      <div style="height:14px"></div><button class="btn wide" onclick="F.step=2;renderReview()">다음</button>`;
  } else if (F.step === 2) {
    body = `<div class="step">2. 다시 고른다면 바꾸고 싶은 건?</div>
      <div class="chips">${outs.map((t) => txChip(t, "change")).join("")}<button class="chip ${F.change === "none" ? "on" : ""}" onclick="F.change='none';pickChip(this)">없어요, 다 잘 썼어요!</button></div>
      <p class="small muted">아쉬운 게 있어도 괜찮아요. 알아차리는 게 제일 중요해요 🙂</p>
      <div class="step" style="margin-top:12px">3. 다음 2주 나의 약속 하나!</div>
      <div class="chips">${PROMISES.map((p) => `<button class="chip ${F.promise === p ? "on" : ""}" onclick="F.promise='${p}';pickChip(this)">${p}</button>`).join("")}</div>
      <div class="step" style="margin-top:12px">이번 2주 용돈 관리 기분은?</div>
      <div class="chips">${[["good", "😊 뿌듯해요"], ["soso", "😐 보통"], ["bad", "😢 아쉬워요"]].map(([k, n]) => `<button class="chip ${F.mood === k ? "on" : ""}" onclick="F.mood='${k}';pickChip(this)">${n}</button>`).join("")}</div>
      <div style="height:14px"></div><div class="row"><button class="btn sec" onclick="F.step=1;renderReview()">이전</button><button class="btn wide grow" onclick="if(!F.promise)return toast('약속을 하나 골라요');F.step=3;renderReview()">다음</button></div>`;
  } else if (F.step === 3) {
    body = `<div class="step">4. 잔액 맞추기 ⚖️</div>
      <p>지갑·저금통에 있는 진짜 돈이 앱이랑 같은지 세어 봐요.</p>
      <div class="split">${JARS.filter((j) => j.k !== "bank" || bal("bank")).map((j) => `<div class="jar" style="--c:${j.c}"><div class="ic">${j.icon}</div><div class="nm">${j.name}</div><div class="amt num">${fmt(F.adj[j.k] ?? bal(j.k))}</div>
        <div class="adj"><button onclick="reviewAdj('${j.k}')" style="width:auto;padding:0 8px">고치기</button></div></div>`).join("")}</div>
      <div style="height:12px"></div>
      <div class="grid2"><button class="btn ok" onclick="F.matched=Object.keys(F.adj).length===0;reviewSave()">${Object.keys(F.adj).length ? "고친 대로 저장" : "딱 맞아요! ⚖️"}</button>
      <button class="btn sec" onclick="F.step=2;renderReview()">이전</button></div>
      <p class="small muted center">차이가 나도 혼나지 않아요. '모르는 돈'으로 기록하고 다음엔 더 꼼꼼히!</p>`;
  }
  setModal(head(title) + body);
}
function reviewAdj(k) {
  setModal(`${head(`${JAR[k].icon} ${JAR[k].name} 진짜 돈은?`, "renderReview()")}
    ${keypad(F.adj[k] ?? Math.max(0, bal(k)), Infinity, () => {})}
    <div style="height:12px"></div><button class="btn wide" onclick="F.adj['${k}']=KP.v;renderReview()">확인</button>`);
}
function reviewSave() {
  const f = { ...F, adj: { ...F.adj } }, t = today(), now = new Date().toISOString();
  const q = TALK_QS[Math.floor(Math.random() * TALK_QS.length)];
  commit((st) => {
    for (const [k, v] of Object.entries(f.adj)) {
      const cur = st.txs.filter((x) => x.jar === k).reduce((a, x) => a + x.amount, 0);
      if (v - cur) st.txs.push({ id: uid(), at: now, date: t, kind: "adjust", jar: k, amount: v - cur, cat: v - cur < 0 ? "모르는 지출" : "모르는 돈", memo: "잔액 맞추기" });
    }
    st.reviews = st.reviews.filter((r) => r.cycle !== f.cyc);
    st.reviews.push({ id: uid(), cycle: f.cyc, at: now, best: f.best, change: f.change, promise: f.promise, mood: f.mood, matched: f.matched, talkQ: q });
    addXP(st, "rev:" + f.cyc, 20, "2주 돌아보기");
    if (f.matched) { addXP(st, "match:" + f.cyc, 10, "잔액 딱 맞추기"); addBadge(st, "match"); }
    addBadge(st, "first_review");
    if (st.reviews.length >= 5) addBadge(st, "review5");
    recordToday(st, t);
  });
  setModal(`<div class="center"><div style="font-size:4rem">🌟</div><h2>돌아보기 끝!</h2>
    <p>다음 2주 약속: <b class="jua">${esc(f.promise)}</b></p>
    <div class="info" style="text-align:left">👨‍👩‍👦 <b>부모님과 이야기해 봐요</b><br>"${esc(q)}"</div>
    <div style="height:12px"></div><button class="btn" onclick="closeModal();checkLevelUp()">좋아요!</button></div>`);
}

// ---------- 기록장 ----------
let BOOK_F = "all", BOOK_N = 40;
function viewBook() {
  const cyc = curCycle(), list = txsInCycle(cyc);
  const outs = list.filter((t) => t.kind === "out");
  const byCat = {};
  outs.forEach((t) => (byCat[t.cat] = (byCat[t.cat] || 0) - t.amount));
  const outSum = outs.reduce((a, t) => a - t.amount, 0);
  const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const txs = S.txs.filter((t) => BOOK_F === "all" || t.jar === BOOK_F).sort((a, b) => (a.at < b.at ? 1 : -1));
  const groups = {};
  txs.slice(0, BOOK_N).forEach((t) => (groups[t.date] = groups[t.date] || []).push(t));
  return `
  <div class="card"><h2>이번 2주 (${kdate(payday(cyc))}~)</h2>
    <div class="row wrap" style="gap:16px"><div>쓴 돈 <b class="jua minus" style="font-size:1.3rem">${fmt(outSum)}</b></div><div>전체 가진 돈 <b class="jua" style="font-size:1.3rem">${fmt(total())}</b></div></div>
    ${cats.length ? `<div style="margin-top:8px">${cats.map(([c, v]) => `<div class="row small" style="margin:4px 0"><span style="width:90px">${esc(c)}</span><div class="prog grow" style="height:14px"><i style="width:${Math.round((v / outSum) * 100)}%;background:linear-gradient(90deg,#FFC69A,#FF8A5B)"></i></div><span style="width:70px;text-align:right">${fmt(v)}</span></div>`).join("")}</div>` : `<p class="muted small">이번 2주에 아직 쓴 돈이 없어요.</p>`}
  </div>
  <div class="chips" style="margin-bottom:10px"><button class="chip ${BOOK_F === "all" ? "on" : ""}" onclick="BOOK_F='all';render()">전체</button>${JARS.map((j) => `<button class="chip ${BOOK_F === j.k ? "on" : ""}" onclick="BOOK_F='${j.k}';render()">${j.icon} ${j.name}</button>`).join("")}</div>
  ${Object.keys(groups).length ? Object.entries(groups).map(([d, ts]) => `<div class="daygrp"><div class="dayh">${kdate(d)}</div>${ts.map(txRow).join("")}</div>`).join("") : `<div class="card center muted">아직 기록이 없어요. 홈에서 '용돈 받았어요'나 '돈 썼어요'를 눌러 봐요!</div>`}
  ${txs.length > BOOK_N ? `<button class="btn sec wide" onclick="BOOK_N+=40;render()">더 보기</button>` : ""}`;
}
function txRow(t) {
  const plus = t.amount > 0;
  const label = t.kind === "deposit" ? "통장에 입금" : t.cat;
  return `<div class="tx" onclick="txDetail('${t.id}')"><span class="e">${catIcon(t)}</span>
    <div class="grow"><div>${esc(label)} ${t.need ? `<span class="tag ${t.need}">${t.need === "need" ? "꼭 필요" : "갖고 싶어"}</span>` : ""}${t.mood ? ` ${{ good: "😊", soso: "😐", bad: "😢" }[t.mood]}` : ""}</div>
    <div class="small muted">${JAR[t.jar]?.icon || ""} ${JAR[t.jar]?.name || ""}${t.memo ? " · " + esc(t.memo) : ""}</div></div>
    <span class="m ${plus ? "plus" : "minus"}">${plus ? "+" : "−"}${fmt(Math.abs(t.amount))}</span></div>`;
}
function txDetail(id) {
  const t = S.txs.find((x) => x.id === id);
  if (!t) return;
  const canDel = isParent() || t.date === today();
  openModal(`${head("기록 보기")}
    ${txRow(t)}
    <p class="muted small">${kdate(t.date)} 기록</p>
    ${canDel ? `<button class="btn bad wide" onclick="txDelete('${t.id}')">이 기록 지우기</button>` : `<p class="small muted">지난 기록은 부모님 모드에서 고칠 수 있어요.</p>`}`);
}
function txDelete(id) {
  const t = S.txs.find((x) => x.id === id);
  const grp = t && t.group;
  commit((st) => { st.txs = st.txs.filter((x) => x.id !== id && (!grp || x.group !== grp)); });
  closeModal();
  toast(grp ? "이 용돈 기록(나눈 것 전부)을 지웠어요" : "지웠어요");
}

// ---------- 목표 ----------
const GOAL_EMOJI = [["🎮", "게임"], ["🧸", "인형"], ["📚", "책"], ["⚽", "공"], ["🎨", "그림 도구"], ["🚲", "자전거"], ["🎧", "이어폰"], ["🧩", "레고·블록"], ["🎁", "선물"], ["✏️", "학용품"], ["🎡", "놀러 가기"], ["⭐", "기타"]];
function viewGoals() {
  const p = bal("piggy");
  const act = S.goals.filter((g) => !g.doneAt), done = S.goals.filter((g) => g.doneAt);
  return `<div class="card"><h2>🐷 저금통 ${fmt(p)}</h2><p class="muted small">저금통(단기저축)에 모인 돈으로 목표를 이뤄요. 목표는 2개까지!</p></div>
  ${act.map((g) => {
    const pc = Math.min(100, Math.round((p / g.price) * 100));
    const leftN = Math.max(0, g.price - p);
    const per = "";
    return `<div class="card"><div class="goal"><span class="e">${g.emoji}</span><div class="grow"><div class="row"><b class="jua grow" style="font-size:1.25rem">${esc(g.name)}</b><span class="jua">${fmt(g.price)}</span></div>
      <div class="prog" style="margin:8px 0"><i style="width:${pc}%"></i><span>${pc}%</span></div>
      <div class="small muted">${leftN ? `앞으로 ${fmt(leftN)} 더 모으면 돼요!${per}` : "목표 금액을 다 모았어요! 🎉"}</div></div></div>
      <div class="row" style="margin-top:10px">${leftN ? "" : `<button class="btn ok grow" onclick="goalReached('${g.id}')">살까? 더 모을까?</button>`}
      <button class="chip" onclick="goalDelete('${g.id}')">목표 지우기</button></div></div>`;
  }).join("")}
  ${act.length < 2 ? `<button class="btn wide" onclick="goalNew()">＋ 새 목표 만들기</button>` : ""}
  ${done.length ? `<div class="card" style="margin-top:14px"><h2>🏆 이룬 목표</h2>${done.map((g) => `<div class="row" style="margin:6px 0"><span style="font-size:1.6rem">${g.emoji}</span><span class="grow">${esc(g.name)}</span><span class="small muted">${kdate(g.doneAt)}</span></div>`).join("")}</div>` : ""}`;
}
function goalNew() {
  F = { emoji: "", name: "", price: 0, step: 1 };
  openModal(""); renderGoalNew();
}
function renderGoalNew() {
  if (F.step === 1) {
    setModal(`${head("새 목표 🎯")}<div class="step">1. 무엇을 위해 모을까요?</div>
      <div class="tiles">${GOAL_EMOJI.map(([e, n]) => `<button class="tile ${F.emoji === e ? "on" : ""}" onclick="F.emoji='${e}';F.name=F.name||'${n}';F.step=2;renderGoalNew()"><span class="e">${e}</span>${n}</button>`).join("")}</div>`);
  } else if (F.step === 2) {
    setModal(`${head("새 목표 🎯", "F.step=1;renderGoalNew()")}<div class="step">2. 목표 이름 (그대로 둬도 돼요)</div>
      <input class="inp" id="gname" value="${esc(F.name)}" maxlength="20">
      <div class="step" style="margin-top:12px">3. 얼마예요?</div>
      ${keypad(F.price, Infinity, (v) => (F.price = v))}
      <div style="height:12px"></div><button class="btn wide ok" onclick="F.name=$('#gname').value.trim()||F.name;if(!F.price)return toast('가격을 눌러 주세요');goalSave()">목표 만들기!</button>`);
  }
}
function goalSave() {
  const g = { id: uid(), emoji: F.emoji, name: F.name, price: F.price, at: today(), doneAt: null };
  commit((st) => st.goals.push(g));
  closeModal(); toast("목표가 생겼어요! 조금씩 모아 봐요 🐷");
}
function goalDelete(id) {
  if (!confirm("이 목표를 지울까요?")) return;
  commit((st) => (st.goals = st.goals.filter((g) => g.id !== id)));
}
function goalReached(id) {
  const g = S.goals.find((x) => x.id === id);
  if (!g) return;
  openModal(`<div class="center"><div style="font-size:4.5rem">${g.emoji}</div><h2>'${esc(g.name)}' 목표 금액을 모았어요! 🎉</h2>
    <p>저금통 ${fmt(bal("piggy"))} · 가격 ${fmt(g.price)}</p>
    <p class="jua" style="font-size:1.2rem">지금 살까요? 아니면 더 모을까요?</p>
    <p class="small muted">하루 더 생각해 보는 것도 좋은 방법이에요. 아직도 갖고 싶은지 생각해 봐요!</p>
    <div class="grid2"><button class="btn ok" onclick="goalBuy('${g.id}')">살래요! 🛍️</button><button class="btn sec" onclick="goalKeep('${g.id}')">더 모을래요 🐷</button></div></div>`);
}
function goalBuy(id) {
  const g = S.goals.find((x) => x.id === id), t = today(), now = new Date().toISOString();
  commit((st) => {
    const gg = st.goals.find((x) => x.id === id); if (!gg) return;
    gg.doneAt = t;
    st.txs.push({ id: uid(), at: now, date: t, kind: "out", jar: "piggy", amount: -gg.price, cat: "목표 물건", need: "want", mood: "good", memo: gg.name });
    addXP(st, "goal:" + id, 50, "목표 달성");
    addBadge(st, "goal_done");
    recordToday(st, t);
  });
  closeModal(); coinRain(); toast(`'${g.name}' 목표 달성! 참고 모은 너, 최고야! 🏆`);
}
function goalKeep(id) {
  commit((st) => { addXP(st, "goal:" + id, 50, "목표 달성"); addBadge(st, "goal_done"); });
  closeModal(); toast("더 모으기로 했군요! 멋진 선택이에요 🐷");
}

// ---------- 통장 탭 ----------
// 통장 종류별 모양
const ACC_STYLE = { 입출금: { e: "🏦", c: "#3DA5F4" }, 적금: { e: "🌟", c: "#FFB300" }, 예금: { e: "💎", c: "#9B6BFF" } };
let BANK_CH = "main";
function accInfo(a) {
  const p = S.bank.products.find((x) => x.id === a.id) || null;
  const e = bankEstimate(a.id), ii = interestInfo(a.id);
  const st = ACC_STYLE[a.type] || ACC_STYLE.입출금;
  let mat = null;
  if (p && p.end) {
    const dd = daysBetween(today(), p.end), total = Math.max(1, daysBetween(p.start || today(), p.end));
    let expInt = 0;
    if (p.rate && p.type === "예금") expInt = Math.round((Math.max(0, e.est) * p.rate) / 100 * (total / 365));
    if (p.rate && p.type === "적금" && p.monthly) { const n = Math.max(1, Math.round(total / 30.4)); expInt = Math.round((p.monthly * p.rate) / 100 * (n * (n + 1)) / 2 / 12); }
    mat = { dd, total, pct: Math.min(100, Math.max(0, Math.round(((total - dd) / total) * 100))), expInt };
  }
  return { a, p, e, ii, st, mat };
}
function accountsCard() {
  const accs = bankAccounts().map(accInfo);
  const tot = accs.reduce((s, x) => s + Math.max(0, x.e.est), 0);
  const hasDep = S.bank.products.some((p) => p.type === "예금"), hasSav = S.bank.products.some((p) => p.type === "적금");
  return `<div class="card"><h2>📒 내 통장 ${accs.length}개</h2>
    ${tot ? `<div class="accbar">${accs.map((x) => `<i style="width:${(Math.max(0, x.e.est) / tot) * 100}%;background:${x.st.c}" title="${esc(x.a.name)}"></i>`).join("")}</div>` : ""}
    ${accs.map((x) => `<div class="acc" style="--c:${x.st.c}">
      <div class="row"><span class="ae">${x.st.e}</span><div class="grow"><b class="jua" style="font-size:1.15rem">${esc(x.a.name)}</b>
        <div class="small muted">${x.p ? esc(x.a.type) + " 통장" : "기본 통장 · 넣고 빼는 통장"}${x.p && x.p.bank ? " · " + esc(x.p.bank) : ""}${x.p && x.p.rate ? ` · 연 ${x.p.rate}%` : ""}${x.p && x.p.monthly ? ` · 매달 ${fmt(x.p.monthly)}` : ""}</div></div>
        <div style="text-align:right"><div class="jua" style="font-size:1.45rem">${fmt(x.e.est)}</div>${tot ? `<div class="small muted">${Math.round((Math.max(0, x.e.est) / tot) * 100)}%</div>` : ""}</div></div>
      <div class="small muted" style="margin:4px 0 0 46px">${x.e.last ? `${kdate(x.e.last.date)} 통장 ${x.e.last.photoId ? "사진" : "기록"} ${fmt(x.e.last.balance)}${x.e.est !== x.e.last.balance ? " + 그 뒤 입금" : ""}` : "아직 잔액 기록이 없어요"}${x.ii.interest ? ` · 🎁 이자 ${fmt(x.ii.interest)}` : ""}</div>
      ${x.mat ? `<div style="margin:8px 0 0 46px"><div class="prog" style="height:18px"><i style="width:${x.mat.pct}%;background:linear-gradient(90deg,#FFE27A,${x.st.c})"></i><span>${x.mat.dd >= 0 ? `만기까지 ${x.mat.dd}일 (${x.p.end.slice(0, 4)}년 ${kdate(x.p.end)})` : "만기가 됐어요! 🎉 부모님과 은행에 가요"}</span></div>
        ${x.mat.expInt ? `<div class="small" style="margin-top:4px">🎁 만기에 받을 이자 예상: 약 <b>${fmt(x.mat.expInt)}</b> <span class="muted">(세금 떼기 전)</span></div>` : ""}</div>` : ""}
      <div class="row" style="margin:8px 0 0 46px;gap:6px"><button class="chip" onclick="bankFlowAcc('photo','${x.a.id}')">📸 사진</button><button class="chip" onclick="bankFlowAcc('manual','${x.a.id}')">✍️ 잔액</button>${x.p ? `<button class="chip" onclick="parentEnter(()=>productEdit('${x.p.id}'))">⚙️ 정보</button>` : ""}</div>
    </div>`).join("")}
    <div class="acctotal"><span class="jua">합계</span><span class="jua" style="font-size:1.7rem">${fmt(tot)}</span></div>
    ${!hasDep || !hasSav ? `<div class="row wrap" style="gap:8px;margin-top:10px">${!hasSav ? `<button class="btn sec grow" onclick="parentEnter(()=>productEdit(null,'적금'))">🌟 적금 통장 추가</button>` : ""}${!hasDep ? `<button class="btn sec grow" onclick="parentEnter(()=>productEdit(null,'예금'))">💎 예금 통장 추가</button>` : ""}</div><p class="small muted center">통장 추가는 부모님 비밀번호가 필요해요</p>` : ""}
    <button class="btn blue wide" style="margin-top:12px" onclick="bankFlow()">🏦 은행 다녀왔어요</button>
  </div>`;
}
function bankFlowAcc(mode, acc) { bankFlow(mode); F.account = acc; F.to = acc; F.balance = 0; mode === "photo" ? renderBankPhoto() : renderBankManual(); }
function balanceChartCard() {
  const accs = bankAccounts();
  if (!accs.some((a) => a.id === BANK_CH)) BANK_CH = "main";
  const recs = S.bank.records.filter((r) => (r.account || "main") === BANK_CH).sort((a, b) => (a.at < b.at ? -1 : 1));
  const rows = bankRows(BANK_CH).filter((x) => x.bal > 0);
  const chart = rows.length >= 2 ? rows.slice(-12).map((x) => ({ v: x.bal, int: x.int, d: x.d })) : recs.slice(-8).map((r) => ({ v: r.balance, d: r.date }));
  const mx = Math.max(1, ...chart.map((r) => r.v));
  return `<div class="card"><h2>📈 잔액이 자라는 모습</h2>
    ${accs.length > 1 ? `<div class="chips" style="margin-bottom:6px">${accs.map((a) => `<button class="chip ${BANK_CH === a.id ? "on" : ""}" onclick="BANK_CH='${a.id}';render()">${(ACC_STYLE[a.type] || ACC_STYLE.입출금).e} ${esc(a.name)}</button>`).join("")}</div>` : ""}
    ${chart.length > 1 ? `<div class="bars" style="margin-top:14px">${chart.map((r) => `<div class="${r.int ? "gold" : ""}" style="height:${Math.max(4, Math.round((r.v / mx) * 100))}%" title="${r.d || ""}"><span>${r.int ? "🎁" : (r.v / 10000).toFixed(r.v >= 1000000 ? 0 : 1) + "만"}</span></div>`).join("")}</div>
      <div class="small muted center" style="margin-top:4px">통장 사진에서 읽은 잔액${chart.some((r) => r.int) ? " · 🎁 = 이자 받은 날" : ""}</div>` : `<p class="small muted">통장 사진을 올리면 잔액이 자라는 그래프가 생겨요.</p>`}
  </div>`;
}
function viewBank() {
  const sp = savingsProgress();
  const recs = S.bank.records.slice().sort((a, b) => (a.at < b.at ? 1 : -1));
  const step = S.bank.products.some((p) => p.type === "예금") ? 5 : S.bank.products.length ? 4 : sp.ready ? 3 : 2;
  return `
  ${vaultCard(true)}
  ${accountsCard()}
  ${balanceChartCard()}
  ${interestCard()}
  <div class="card"><h2>🪜 저축 사다리</h2>
    ${[["입출금 통장", "지금 쓰는 통장에 꾸준히 넣기", 1], ["적금 준비", `입금 ${sp.dc}/${sp.rule.deposits}번 · 통장 ${fmt(sp.b)}/${fmt(sp.rule.minBalance)}`, 2], ["적금 통장 만들기", "조금씩 여러 번 넣는 약속 통장", 3], ["예금 도전", "적금 만기 돈을 한 번에 맡기기", 4]].map(([n, d, i]) => `
      <div class="row" style="margin:8px 0;opacity:${i <= step ? 1 : 0.45}"><span style="font-size:1.6rem">${i < step ? "✅" : i === step ? "👉" : "🔒"}</span><div class="grow"><b class="jua">${i}. ${n}</b><div class="small muted">${d}</div></div></div>`).join("")}
    ${step === 3 && !S.bank.products.length ? `<div class="info">🌱 <b>적금 통장 만들 준비 완료!</b> 부모님께 "적금 통장 만들고 싶어요"라고 말해 봐요. (부모님 모드에 준비물 목록이 있어요)</div>` : ""}
    <div class="prog" style="margin-top:8px"><i style="width:${Math.min(100, Math.round((Math.min(1, sp.dc / sp.rule.deposits) * 50) + Math.min(1, sp.b / sp.rule.minBalance) * 50))}%;background:linear-gradient(90deg,#9ED7FF,#3DA5F4)"></i><span>적금 준비 ${Math.min(100, Math.round((Math.min(1, sp.dc / sp.rule.deposits) * 50) + Math.min(1, sp.b / sp.rule.minBalance) * 50))}%</span></div>
  </div>
  <div class="card"><h2>📖 예금과 적금, 뭐가 달라요?</h2>
    <div class="grid2"><div class="info"><b class="jua">🌟 적금</b><br>돈을 <b>조금씩 여러 번</b> 넣어서 쌓아 가는 통장이에요. 2주마다 2,000원씩 넣는 우리한테 딱 맞아요!</div>
    <div class="info"><b class="jua">💎 예금</b><br>모아 둔 돈을 <b>한 번에</b> 맡기고, 약속한 날까지 기다리는 통장이에요.</div></div>
    <p class="small muted">약속한 날(만기)보다 먼저 꺼내면 이자가 줄어요. 이자는 작지만, 끝까지 약속을 지키는 경험이 진짜 보물이에요!</p></div>
  <div class="card"><h2>📸 통장 사진 기록</h2>
    ${recs.length ? recs.slice(0, 12).map((r) => `<div class="tx" onclick="showRecord('${r.id}')"><span class="e">${r.photoId ? "📸" : "✍️"}</span><div class="grow"><div class="jua">${fmt(r.balance)}</div><div class="small muted">${kdate(r.date)} · ${esc(bankAccounts().find((a) => a.id === (r.account || "main"))?.name || "통장")}</div></div>${r.parentOk ? `<span class="tag need">부모님 확인 ✔</span>` : ""}</div>`).join("") : `<p class="muted">아직 없어요.</p>`}</div>`;
}
function showRecord(id) {
  const r = S.bank.records.find((x) => x.id === id);
  if (!r) return;
  openModal(`${head(`${kdate(r.date)} 통장 잔액`)}${photoImg(r.photoId)}
    <p class="jua center" style="font-size:1.6rem">${fmt(r.balance)}</p>
    ${r.ai != null && r.ai !== r.balance ? `<p class="small muted center">AI가 읽은 값: ${fmt(r.ai)} → 직접 고침</p>` : ""}
    ${(r.rows || []).length ? `<p class="small muted center">AI가 거래 ${r.rows.length}줄을 읽었어요${r.rows.some((x) => x.int) ? ` · 🎁 이자 ${fmt(r.rows.filter((x) => x.int).reduce((a, x) => a + x.in, 0))}` : ""}</p>` : ""}
    ${isParent() ? `<div class="grid2"><button class="btn ok" onclick="recOk('${r.id}')">${r.parentOk ? "확인 취소" : "✔ 부모님 확인"}</button><button class="btn bad" onclick="recDel('${r.id}')">기록 지우기</button></div>` : ""}`);
}
function recOk(id) { commit((st) => { const r = st.bank.records.find((x) => x.id === id); if (r) r.parentOk = !r.parentOk; }); closeModal(); }
function recDel(id) { if (!confirm("이 통장 기록을 지울까요?")) return; commit((st) => (st.bank.records = st.bank.records.filter((x) => x.id !== id))); closeModal(); }

// ---------- 계약서 ----------
function ruleText(r, jarK, rules) {
  if (!r || r.t === "none") return "-";
  if (r.t === "fixed") return fmt(r.v);
  if (r.t === "pct") return r.v + "%";
  return "나머지";
}
function contractPaper(c, opts = {}) {
  const names = (c.parents || "").trim() || "부모님";
  return `<div class="paper">
    ${c.sigChild && c.sigParent ? `<div class="stamp">계약 완료</div>` : ""}
    <div class="heart">🌿❤️🌿</div><h2>용돈 계약서</h2>
    <p class="center muted small">제 ${c.version}차 계약</p>
    <p>나 ( <b class="jua">${esc(c.child || "　　　")}</b> )와 ( <b class="jua">${esc(names)}</b> )은 다음과 같이 용돈 계약을 맺습니다.</p>
    <ol>
      <li><b>용돈 계약 기간</b>: ${c.start.slice(0, 4)}년 ${kdate(c.start)} ~ ${c.end.slice(0, 4)}년 ${kdate(c.end)}</li>
      <li><b>용돈 지급 주기</b>: ${c.cycleDays === 7 ? "1주" : c.cycleDays === 30 ? "한 달" : (c.cycleDays / 7) + "주"}에 한 번 (첫 용돈날 ${kdate(c.firstPayday)})</li>
      <li><b>기본 용돈 금액</b>: ${fmt(c.base)}</li>
      <li><b>특약 사항</b>
        <ol>${c.clauses.map((x, i) => `<li>${esc(x)}${i === 1 ? `
          <table><tr><th></th>${JARS.map((j) => `<th>${j.icon}<br>${j.name}</th>`).join("")}</tr>
          <tr><th>기본</th>${JARS.map((j) => `<td>${ruleText(c.baseSplit[j.k])}</td>`).join("")}</tr>
          <tr><th>특별</th>${JARS.map((j) => `<td>${ruleText(c.specialSplit[j.k])}</td>`).join("")}</tr>
          <tr><th>노력</th>${JARS.map((j) => `<td>${ruleText(c.choreSplit[j.k])}</td>`).join("")}</tr></table>` : ""}</li>`).join("")}</ol></li>
    </ol>
    <p>나 ( <b class="jua">${esc(c.child || "　　　")}</b> )와 ( <b class="jua">${esc(names)}</b> )은 용돈 계약서에 적힌 사항을 지키기 위해 노력할 것이다.</p>
    <p class="center jua" style="font-size:1.15rem">${c.signedAt ? `${c.signedAt.slice(0, 4)}년 ${Number(c.signedAt.slice(5, 7))}월 ${Number(c.signedAt.slice(8, 10))}일` : ""}</p>
    <div class="sigs"><div class="sig">${c.sigChild ? photoImg(c.sigChild, "") : opts.live ? `<button class="chip" onclick="signFlow('child')">✍️ ${esc(c.child || "나")} 서명하기</button>` : "서명 없음"}<span class="small muted">${esc(c.child || "나")}</span></div>
      <div class="sig">${c.sigParent ? photoImg(c.sigParent, "") : opts.live ? `<button class="chip" onclick="signFlow('parent')">✍️ 부모님 서명하기</button>` : "서명 없음"}<span class="small muted">${esc(names)}</span></div></div>
  </div>`;
}
function viewContract() {
  const c = C(), dd = daysBetween(today(), c.end);
  const props = S.proposals.filter((p) => p.status === "new");
  return `
  ${dd <= 30 ? `<div class="card notice"><b class="jua">📜 ${dd < 0 ? "계약 기간이 끝났어요!" : `계약 끝나기 ${dd}일 전이에요!`}</b><br>부모님과 함께 지난 계약을 돌아보고 새 계약서를 써요. (부모님 모드 → 계약 관리 → 새 계약으로 갱신)</div>` : ""}
  ${contractPaper(c, { live: true })}
  <div class="grid2" style="margin-top:14px">
    ${c.paperPhotoId ? `<button class="btn sec" onclick="openModal(head('처음 쓴 종이 계약서')+photoImg('${c.paperPhotoId}'))">🖼️ 종이 계약서 보기</button>` : ""}
    <button class="btn sec" onclick="proposalFlow()">🙋 용돈 올려 주세요 제안서</button>
    ${S.contractHistory.length ? `<button class="btn sec" onclick="historyModal()">📚 지난 계약서 (${S.contractHistory.length})</button>` : ""}
  </div>
  ${props.length ? `<p class="info" style="margin-top:12px">🙋 제안서를 보냈어요: ${props.map((p) => fmt(p.amount)).join(", ")} — 부모님이 읽고 답해 주실 거예요.</p>` : ""}
  <div class="card" style="margin-top:14px"><h2>📅 계약서는 언제 다시 봐요?</h2>
    <p class="small">• 새 학기(3월·9월)에 약속이 잘 지켜지는지 같이 봐요.<br>• 계약 기간이 끝나기 전에 새 계약서를 써요.<br>• 학년이 올라가면 용돈 금액을 다시 이야기해요. 용돈기입장이 좋은 근거가 돼요!</p></div>`;
}
function contractReviewDone() {
  const k = "creview:" + today().slice(0, 7);
  commit((st) => addXP(st, k, 10, "계약서 다시 보기"));
  go("contract");
}
function historyModal() {
  openModal(`${head("📚 지난 계약서")}${S.contractHistory.slice().reverse().map((c) => contractPaper(c) + "<div style='height:14px'></div>").join("")}`);
}
function proposalFlow() {
  F = { amount: C().base, reasons: [] };
  const rs = ["학년이 올라가서", "필요한 게 늘어서", "기록을 꾸준히 잘해서", "저축을 더 하고 싶어서", "기부를 더 하고 싶어서"];
  openModal(`${head("🙋 용돈 인상 제안서")}
    <p>지금 기본 용돈은 <b>${fmt(C().base)}</b>이에요. 얼마로 올려 주면 좋겠어요?</p>
    ${keypad(F.amount, Infinity, (v) => (F.amount = v))}
    <div class="step" style="margin-top:12px">왜 그렇게 생각해요? (여러 개 골라도 돼요)</div>
    <div class="chips">${rs.map((r) => `<button class="chip" onclick="this.classList.toggle('on');F.reasons=[...this.parentElement.querySelectorAll('.on')].map(x=>x.textContent)">${r}</button>`).join("")}</div>
    <p class="small muted">💡 용돈기입장 기록이 좋은 근거가 돼요. 부모님께 보여 드리며 이야기해 봐요!</p>
    <button class="btn wide" onclick="proposalSave()">부모님께 제안서 보내기 📮</button>`);
}
function proposalSave() {
  const p = { id: uid(), at: today(), amount: F.amount, reasons: F.reasons, status: "new" };
  commit((st) => st.proposals.push(p));
  closeModal(); toast("제안서를 보냈어요! 📮");
}

// 서명
let PAD = null;
function signFlow(who) {
  if (who === "parent" && !isParent()) return parentEnter(() => signFlow("parent"));
  openModal(`${head(who === "child" ? "✍️ 내 이름 서명하기" : "✍️ 부모님 서명")}
    <p class="muted">손가락으로 이름을 써 주세요.</p>
    <canvas class="pad" id="pad"></canvas>
    <div class="grid2" style="margin-top:12px"><button class="btn sec" onclick="padClear()">다시 쓰기</button><button class="btn ok" onclick="signSave('${who}')">서명 완료</button></div>`);
  const cv = $("#pad"), r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
  cv.width = r.width * dpr; cv.height = r.height * dpr;
  const g = cv.getContext("2d"); g.scale(dpr, dpr); g.lineWidth = 4; g.lineCap = "round"; g.lineJoin = "round"; g.strokeStyle = "#2B2135";
  PAD = { cv, g, drawn: false };
  let down = false;
  const pt = (e) => { const b = cv.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
  cv.onpointerdown = (e) => { down = true; cv.setPointerCapture(e.pointerId); const [x, y] = pt(e); g.beginPath(); g.moveTo(x, y); };
  cv.onpointermove = (e) => { if (!down) return; const [x, y] = pt(e); g.lineTo(x, y); g.stroke(); PAD.drawn = true; };
  cv.onpointerup = () => (down = false);
}
function padClear() { PAD.g.clearRect(0, 0, PAD.cv.width, PAD.cv.height); PAD.drawn = false; }
async function signSave(who) {
  if (!PAD.drawn) return toast("이름을 써 주세요");
  const url = PAD.cv.toDataURL("image/png");
  const r = await api("/api/photo", { method: "POST", body: { dataUrl: url } });
  if (r.status !== 200) return toast(r.data.error || "저장 실패");
  PHOTO_CACHE[r.data.id] = url;
  const id = r.data.id, ver = C().version;
  commit((st) => {
    if (st.contract.version !== ver) return;
    st.contract[who === "child" ? "sigChild" : "sigParent"] = id;
    if (st.contract.sigChild && st.contract.sigParent) { st.contract.signedAt = st.contract.signedAt || today(); addXP(st, "contract:" + ver, 30, "계약서 서명"); addBadge(st, "contract_sign"); }
  });
  closeModal(); toast("서명 완료! ✍️");
}

// ---------- 도감·배지 ----------
function dexModal() {
  const L = levelInfo(S.xp), P = SPECIES[S.profile.species];
  openModal(`${head("📖 도감 · 배지")}
    <div class="tiles">${[0, 1, 2, 3].map((s) => {
      const open = stageOf(L.lv) >= s;
      return `<div class="tile" style="${open ? "" : "filter:brightness(0);opacity:.25"}"><div style="width:100%">${creatureSVG(S.profile.species, s)}</div>${open ? P.names[s] : "???"}<span class="small muted">Lv.${STAGE_AT[s]}</span></div>`;
    }).join("")}</div>
    <h3 class="jua" style="margin:16px 0 6px">🏅 배지 (${Object.keys(S.badges).length}/${Object.keys(BADGES).length})</h3>
    <div>${Object.entries(BADGES).map(([k, [e, n]]) => `<div class="badge ${S.badges[k] ? "" : "off"}"><span class="e">${e}</span>${n}</div>`).join("")}</div>
    <h3 class="jua" style="margin:16px 0 6px">⭐ 최근 받은 XP</h3>
    ${S.xpLog.slice(0, 12).map((x) => `<div class="row small" style="margin:3px 0"><span class="grow">${esc(x.reason)}</span><span class="muted">${x.at.slice(5, 10).replace("-", "/")}</span><b style="width:60px;text-align:right;color:var(--brand)">+${x.amt}</b></div>`).join("") || `<p class="muted small">아직 없어요</p>`}
    <div class="info small" style="margin-top:12px">XP는 이럴 때 받아요: 기록한 날 +5 · 계획대로 나누기 +15 · 2주 돌아보기 +20 · 잔액 딱 맞추기 +10 · 은행 입금 +40 · 혼자 은행 다녀오기 +30 · 통장 사진 +30 · 이자 발견 +20 · 기부 +30 · 목표 달성 +50 · 계약서 서명 +30<br>
    돈을 적게 쓴다고 XP를 더 주지는 않아요. <b>솔직하게 기록하는 게</b> 친구를 키우는 방법이에요!</div>`);
}

// ---------- 레벨업 이벤트 ----------
function checkLevelUp() {
  if (!S || !S.profile.species) return;
  if (checkTierUp()) return;
  if (isParentDevice()) { lsSet("yd_seenLv", levelInfo(S.xp).lv); return; }
  const seen = lsGet("yd_seenLv", 1), lv = levelInfo(S.xp).lv;
  if (lv > seen && !document.querySelector(".celebrate") && !document.querySelector(".modal")) {
    lsSet("yd_seenLv", lv);
    celebrate(seen, lv);
  }
}
function celebrate(from, to) {
  const sp = S.profile.species, s0 = stageOf(from), s1 = stageOf(to);
  const evo = s1 > s0;
  const el = document.createElement("div");
  el.className = "celebrate";
  const oldName = SPECIES[sp].names[s0];
  el.innerHTML = `<div class="big-char" id="cchar">${creatureSVG(sp, s0)}</div><h1 id="ctitle">${evo ? (s0 === 0 ? "어? 알이 움직여요!" : `어? ${esc(S.profile.nickname || oldName)}의 모습이…!`) : `레벨 업! Lv.${to}`}</h1><p id="csub">${evo ? "두근두근…" : ""}</p><div id="cbtn"></div>`;
  document.body.appendChild(el);
  confetti(el);
  const finish = () => {
    $("#cchar").innerHTML = creatureSVG(sp, s1, { happy: true, crown: S.badges.savings_open, crack: s1 === 0 && to === 2 });
    const nn = SPECIES[sp].names[s1];
    $("#ctitle").textContent = evo ? (s0 === 0 ? `알이 깨어났어요! ${jo(nn, "이에요", "예요")}!` : `${jo(nn, "으로", "로")} 진화했어요!`) : `레벨 업! Lv.${to}`;
    $("#csub").textContent = evo ? `Lv.${to} 달성! 용돈 관리를 잘해서 쑥쑥 자랐어요.` : `${jo(charName(), "이", "가")} 한 뼘 더 자랐어요!`;
    $("#cbtn").innerHTML = `<button class="btn" onclick="quiz()">🎁 레벨업 선물: 돈 퀴즈!</button> <button class="btn sec" onclick="this.closest('.celebrate').remove();render()">닫기</button>`;
    confetti(el);
    if (evo && s0 === 0 && !S.profile.nickname) setTimeout(() => toast("부모님 모드나 도감에서 이름을 지어 줄 수 있어요"), 1500);
  };
  if (evo) { $("#cchar").classList.add("flash"); setTimeout(finish, 2400); } else finish();
}
function confetti(root) {
  const cols = ["#FF6FA5", "#FFB547", "#3DA5F4", "#22B07D", "#A97BFF", "#FF8A3D"];
  for (let i = 0; i < 40; i++) {
    const c = document.createElement("i");
    c.className = "confetti";
    c.style.left = Math.random() * 100 + "%";
    c.style.background = cols[i % cols.length];
    c.style.animationDuration = 2 + Math.random() * 2 + "s";
    c.style.animationDelay = Math.random() * 0.6 + "s";
    root.appendChild(c);
    setTimeout(() => c.remove(), 5000);
  }
}
function quiz() {
  const q = QUIZ[Math.floor(Math.random() * QUIZ.length)];
  const el = document.querySelector(".celebrate");
  el.innerHTML = `<div style="font-size:3rem">❓</div><h1 style="font-size:1.6rem;max-width:560px">${esc(q[0])}</h1>
    <div class="row" style="gap:20px;margin-top:20px"><button class="btn ok" style="font-size:2.4rem;padding:16px 36px" onclick="quizAns(${q[1]},true)">O</button>
    <button class="btn bad" style="font-size:2.4rem;padding:16px 36px" onclick="quizAns(${q[1]},false)">X</button></div>`;
  window._q = q;
}
function quizAns(correct, pick) {
  const q = window._q, el = document.querySelector(".celebrate"), ok = correct === pick;
  el.innerHTML = `<div style="font-size:4rem">${ok ? "🎉" : "🤔"}</div><h1>${ok ? "정답!" : "아쉬워요!"}</h1><p style="font-size:1.2rem;max-width:520px">${esc(q[2])}</p>
    <button class="btn" onclick="this.closest('.celebrate').remove();render()">닫기</button>`;
  if (ok) confetti(el);
}

// ---------- 칭찬 편지 ----------
function unreadPraises() {
  if (!S || isParentDevice()) return [];
  const seen = lsGet("yd_seenPraise", []);
  return S.praises.filter((p) => !seen.includes(p.id));
}
function showUnreadPraise(force) {
  const u = unreadPraises();
  if (!u.length || (!force && document.querySelector(".modal"))) return;
  const p = u[0];
  openModal(`<div class="center"><div style="font-size:4rem">💌</div><h2>칭찬 편지가 왔어요!</h2></div>
    <div class="letter">${esc(p.text).replace(/\n/g, "<br>")}<div style="text-align:right">- ${esc(p.from || "엄마·아빠")} (${kdate(p.at)}) -</div></div>
    <div style="height:12px"></div><button class="btn wide" onclick="praiseRead('${p.id}')">고마워요! 💕</button>`);
}
function praiseRead(id) {
  const seen = lsGet("yd_seenPraise", []); seen.push(id); lsSet("yd_seenPraise", seen);
  closeModal(); render(); setTimeout(() => showUnreadPraise(), 300);
}

// ---------- 부모님 모드 ----------
function isParent() { return Date.now() < (window._pmUntil || 0); }
function isParentDevice() { return lsGet("yd_parentDevice", false); }
let PIN_BUF = "", PIN_NEXT = null, PIN_FIRST = "";
function parentEnter(next) {
  if (isParent()) return next ? next() : parentPanel();
  PIN_BUF = ""; PIN_NEXT = next || null; PIN_FIRST = "";
  renderPin();
}
function renderPin(msg) {
  const setMode = !S.parentPinHash;
  const html = `${head("👨‍👩‍👦 부모님 모드")}
    <p class="center">${setMode ? (PIN_FIRST ? "한 번 더 눌러 주세요" : "처음이에요! 부모님 비밀번호 숫자 4자리를 정해 주세요") : "부모님 비밀번호 4자리"}</p>
    ${msg ? `<p class="notice center">${esc(msg)}</p>` : ""}
    <div class="amount num" style="letter-spacing:12px">${"●".repeat(PIN_BUF.length)}${"○".repeat(4 - PIN_BUF.length)}</div>
    <div class="keys" style="max-width:360px;margin:0 auto">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => `<button class="key" onclick="pinKey('${d}')">${d}</button>`).join("")}
      <button class="key" onclick="PIN_BUF='';renderPin()" style="font-size:1rem">지우기</button><button class="key" onclick="pinKey('0')">0</button><button class="key" onclick="closeModal()" style="font-size:1rem">닫기</button></div>`;
  document.querySelector(".modal") ? setModal(html) : openModal(html);
}
async function pinKey(d) {
  PIN_BUF += d;
  if (PIN_BUF.length < 4) return renderPin();
  const h = await sha(PIN_BUF), buf = PIN_BUF; PIN_BUF = "";
  if (!S.parentPinHash) {
    if (!PIN_FIRST) { PIN_FIRST = buf; return renderPin(); }
    if (PIN_FIRST !== buf) { PIN_FIRST = ""; return renderPin("두 번이 달라요. 다시 정해 주세요"); }
    commit((st) => (st.parentPinHash = h));
  } else if (h !== S.parentPinHash) return renderPin("비밀번호가 달라요");
  window._pmUntil = Date.now() + 15 * 60 * 1000;
  closeModal();
  PIN_NEXT ? PIN_NEXT() : parentPanel();
}

let PTAB = "home";
function parentPanel(tab) {
  if (tab) PTAB = tab;
  const tabs = [["home", "📋 요약"], ["contract", "📜 계약"], ["praise", "💌 칭찬"], ["menu", "🧹 메뉴판"], ["bank", "🏦 통장·적금"], ["set", "⚙️ 설정"]];
  const body = { home: pHome, contract: pContract, praise: pPraise, menu: pMenu, bank: pBank, set: pSet }[PTAB]();
  const html = `${head("👨‍👩‍👦 부모님 모드")}<div class="chips" style="margin-bottom:12px">${tabs.map(([k, n]) => `<button class="chip ${PTAB === k ? "on" : ""}" onclick="parentPanel('${k}')">${n}</button>`).join("")}</div>${body}`;
  document.querySelector(".modal") ? setModal(html) : openModal(html);
}
function pHome() {
  const prev = curCycle() - 1, rv = S.reviews.slice().sort((a, b) => b.cycle - a.cycle)[0];
  const tx = (id) => S.txs.find((t) => t.id === id);
  const outs = txsInCycle(curCycle()).filter((t) => t.kind === "out");
  const want = outs.filter((t) => t.need === "want").reduce((a, t) => a - t.amount, 0), need = outs.filter((t) => t.need === "need").reduce((a, t) => a - t.amount, 0);
  const props = S.proposals.filter((p) => p.status === "new");
  return `<div class="card"><h2>이번 2주</h2>
      <p>기록한 날 <b>${countRecDaysInCycle(curCycle())}일</b> · 쓴 돈 <b>${fmt(need + want + outs.filter((t) => !t.need).reduce((a, t) => a - t.amount, 0))}</b> (꼭 필요 ${fmt(need)} / 갖고 싶어 ${fmt(want)})</p>
      <p>현재 레벨 Lv.${levelInfo(S.xp).lv} · XP ${S.xp} · 배지 ${Object.keys(S.badges).length}개</p></div>
    ${rv ? `<div class="card"><h2>최근 돌아보기 (${kdate(payday(rv.cycle))}~)</h2>
      <p>👍 잘 쓴 돈: ${rv.best && rv.best !== "none" && tx(rv.best) ? esc(tx(rv.best).cat) + " " + fmt(-tx(rv.best).amount) : "-"}<br>🔁 바꾸고 싶은 것: ${rv.change && rv.change !== "none" && tx(rv.change) ? esc(tx(rv.change).cat) : "없음"}<br>🤝 다음 약속: ${esc(rv.promise || "-")}<br>⚖️ 잔액: ${rv.matched ? "딱 맞음" : "맞춤 기록 있음"}</p>
      <div class="info">💬 대화 질문: "${esc(rv.talkQ || TALK_QS[0])}"<br><span class="small muted">지출을 평가하기보다 이유를 물어보고 칭찬해 주세요.</span></div></div>` : ""}
    ${props.length ? `<div class="card"><h2>🙋 용돈 인상 제안서</h2>${props.map((p) => `<div class="tx"><div class="grow"><b>${fmt(p.amount)}</b>로 올려 주세요<div class="small muted">${p.reasons.map(esc).join(", ") || "이유 없음"} · ${kdate(p.at)}</div></div>
      <button class="chip" onclick="propAnswer('${p.id}','ok')">수락→계약 갱신</button><button class="chip" onclick="propAnswer('${p.id}','later')">다음에</button></div>`).join("")}</div>` : ""}
    <div class="info small">아이 화면의 지난 기록 수정·삭제는 부모님 모드가 켜진 15분 동안 기록장에서 할 수 있어요.</div>`;
}
function propAnswer(id, ans) {
  const p = S.proposals.find((x) => x.id === id);
  commit((st) => { const q = st.proposals.find((x) => x.id === id); if (q) q.status = ans; });
  if (ans === "ok") { PTAB = "contract"; CE = null; parentPanel(); setTimeout(() => { ceStart(true); CE.base = p.amount; renderCE(); }, 50); }
  else parentPanel();
}

// 계약 편집
let CE = null;
function pContract() {
  const c = C();
  return `<div class="card"><h2>현재 계약 (제 ${c.version}차)</h2><p>${kdate(c.start)} ~ ${kdate(c.end)} · 기본 ${fmt(c.base)} · ${c.cycleDays}일마다</p>
    <p>서명: 아이 ${c.sigChild ? "✔" : "✗"} · 부모 ${c.sigParent ? "✔" : "✗"}</p>
    <div class="grid2"><button class="btn sec" onclick="ceStart(false)">✏️ 내용 고치기 (같은 계약)</button><button class="btn" onclick="ceStart(true)">📜 새 계약으로 갱신</button></div>
    <p class="small muted" style="margin-top:8px">갱신하면 지금 계약서는 '지난 계약서'에 보관되고, 새 계약서에 다시 서명해요. 권장: 새 학기(3월·9월)마다 검토, 학년이 오를 때 금액 협의.</p></div>
    <div class="card"><h2>종이 계약서 사진</h2><label class="btn sec wide" style="display:block;text-align:center">📷 종이 계약서 사진 ${c.paperPhotoId ? "바꾸기" : "올리기"}<input type="file" accept="image/*" style="display:none" onchange="paperPhoto(this.files[0])"></label></div>`;
}
async function paperPhoto(file) {
  if (!file) return;
  const url = await compressImage(file, 1400, 0.75);
  const r = await api("/api/photo", { method: "POST", body: { dataUrl: url } });
  if (r.status !== 200) return toast(r.data.error || "실패");
  PHOTO_CACHE[r.data.id] = url;
  const id = r.data.id;
  commit((st) => (st.contract.paperPhotoId = id));
  toast("종이 계약서 사진을 저장했어요");
}
function ceStart(renew) {
  const c = JSON.parse(JSON.stringify(C()));
  CE = { ...c, renew, clausesText: c.clauses.join("\n") };
  if (renew) {
    // 새 계약은 오늘부터. 용돈날 일정(첫 용돈날·주기)은 그대로 이어 간다.
    CE.start = today();
    CE.end = addDays(CE.start, 182);
  }
  renderCE();
}
function ruleEditor(group) {
  return `<table style="width:100%;font-size:.9rem"><tr>${JARS.map((j) => `<th>${j.icon}${j.name}</th>`).join("")}</tr><tr>${JARS.map((j) => {
    const r = CE[group][j.k] || { t: "none", v: 0 };
    return `<td><select class="inp" style="padding:6px" onchange="CE.${group}.${j.k}={t:this.value,v:CE.${group}.${j.k}?.v||0};renderCE()">
      ${[["none", "없음"], ["fixed", "금액"], ["pct", "%"], ["rest", "나머지"]].map(([v, n]) => `<option value="${v}" ${r.t === v ? "selected" : ""}>${n}</option>`).join("")}</select>
      ${r.t === "fixed" || r.t === "pct" ? `<input class="inp" style="padding:6px;margin-top:4px" type="number" inputmode="numeric" value="${r.v}" onchange="CE.${group}.${j.k}.v=Number(this.value)||0">` : ""}</td>`;
  }).join("")}</tr></table>`;
}
function renderCE() {
  const ex = computeSplit(CE.base, CE.baseSplit);
  setModal(`${head(CE.renew ? "📜 새 계약으로 갱신" : "✏️ 계약 내용 고치기", "parentPanel('contract')")}
    <div class="grid2">
      <label class="fld"><span>아이 이름</span><input class="inp" value="${esc(CE.child)}" onchange="CE.child=this.value"></label>
      <label class="fld"><span>부모님 이름</span><input class="inp" value="${esc(CE.parents)}" onchange="CE.parents=this.value"></label>
      <label class="fld"><span>시작일</span><input class="inp" type="date" value="${CE.start}" onchange="CE.start=this.value"></label>
      <label class="fld"><span>종료일</span><input class="inp" type="date" value="${CE.end}" onchange="CE.end=this.value"></label>
      <label class="fld"><span>첫 용돈날 (주기 계산 기준)</span><input class="inp" type="date" value="${CE.firstPayday}" onchange="CE.firstPayday=this.value"></label>
      <label class="fld"><span>지급 주기</span><select class="inp" onchange="CE.cycleDays=Number(this.value)">${[[7, "1주"], [14, "2주"], [30, "한 달"]].map(([v, n]) => `<option value="${v}" ${CE.cycleDays === v ? "selected" : ""}>${n}</option>`).join("")}</select></label>
      <label class="fld"><span>기본 용돈 (원)</span><input class="inp" type="number" inputmode="numeric" value="${CE.base}" onchange="CE.base=Number(this.value)||0;renderCE()"></label>
    </div>
    <div class="step">기본 용돈 나누기 <span class="muted small">(예시: ${JARS.map((j) => ex[j.k] ? j.name + " " + fmt(ex[j.k]) : "").filter(Boolean).join(" · ")})</span></div>${ruleEditor("baseSplit")}
    <div class="step" style="margin-top:10px">특별 용돈 나누기 <span class="muted small">(금액 → % → 나머지 순서로 계산)</span></div>${ruleEditor("specialSplit")}
    <div class="step" style="margin-top:10px">노력 용돈 나누기</div>${ruleEditor("choreSplit")}
    <label class="fld"><span>특약 사항 (한 줄에 하나, 둘째 줄 아래에 나누기 표가 보여요)</span><textarea class="inp" rows="5" onchange="CE.clausesText=this.value">${esc(CE.clausesText)}</textarea></label>
    <button class="btn wide ok" onclick="ceSave()">${CE.renew ? "새 계약서 만들기 (서명은 계약서 탭에서)" : "저장"}</button>`);
}
function ceSave() {
  const ce = JSON.parse(JSON.stringify(CE));
  if (!ce.start || !ce.end || ce.end < ce.start) return toast("기간을 확인해 주세요");
  ce.clauses = ce.clausesText.split("\n").map((s) => s.trim()).filter(Boolean);
  delete ce.clausesText;
  const renew = ce.renew; delete ce.renew;
  commit((st) => {
    if (renew) {
      st.contractHistory.push(st.contract);
      ce.version = st.contract.version + 1; ce.sigChild = null; ce.sigParent = null; ce.signedAt = today(); ce.paperPhotoId = null;
    }
    st.contract = ce;
  });
  closeModal();
  if (renew) { go("contract"); toast("새 계약서가 만들어졌어요! 둘 다 서명해 주세요 ✍️"); } else toast("저장했어요");
}

function pPraise() {
  return `<div class="card"><h2>💌 칭찬 편지 쓰기</h2><p class="small muted">구체적인 행동을 칭찬하면 효과가 커요. 아이 태블릿을 열면 편지가 떠요.</p>
    <div class="chips" style="margin-bottom:8px">${PRAISE_TEMPLATES.map((t) => `<button class="chip" onclick="$('#ptext').value=this.textContent">${t}</button>`).join("")}</div>
    <textarea id="ptext" class="inp" rows="4" placeholder="이번 주에 이런 점이 멋졌어..."></textarea>
    <label class="fld"><span>보내는 사람</span><input id="pfrom" class="inp" value="엄마·아빠"></label>
    <button class="btn wide" onclick="praiseSend()">편지 보내기 📮</button></div>
    ${S.praises.slice().reverse().slice(0, 10).map((p) => `<div class="tx"><span class="e">💌</span><div class="grow">${esc(p.text)}<div class="small muted">${kdate(p.at)} · ${esc(p.from)}</div></div></div>`).join("")}`;
}
function praiseSend() {
  const text = $("#ptext").value.trim(), from = $("#pfrom").value.trim() || "엄마·아빠";
  if (!text) return toast("내용을 써 주세요");
  const p = { id: uid(), at: today(), text, from };
  commit((st) => st.praises.push(p));
  toast("편지를 보냈어요 💌"); parentPanel("praise");
}
function pMenu() {
  return `<div class="card"><h2>🧹 노력 용돈 메뉴판</h2><p class="small muted">계약서 특약 3번. 아이가 이 일을 하면 '노력 용돈'으로 기록해요. (예시 금액이니 꼭 고쳐 주세요)</p>
    ${S.menu.map((m) => `<div class="row" style="margin:6px 0"><input class="inp" style="width:60px;text-align:center" value="${esc(m.emoji || "⭐")}" onchange="menuEdit('${m.id}','emoji',this.value)">
      <input class="inp grow" value="${esc(m.name)}" onchange="menuEdit('${m.id}','name',this.value)"><input class="inp" style="width:110px" type="number" inputmode="numeric" value="${m.price}" onchange="menuEdit('${m.id}','price',Number(this.value)||0)">
      <button class="chip" onclick="menuDel('${m.id}')">✕</button></div>`).join("")}
    <button class="btn sec wide" onclick="menuAdd()">＋ 일 추가</button></div>`;
}
function menuEdit(id, k, v) { commit((st) => { const m = st.menu.find((x) => x.id === id); if (m) m[k] = v; }); }
function menuDel(id) { commit((st) => (st.menu = st.menu.filter((x) => x.id !== id))); parentPanel("menu"); }
function menuAdd() { const m = { id: uid(), name: "새 일", price: 500, emoji: "⭐" }; commit((st) => st.menu.push(m)); parentPanel("menu"); }

function pBank() {
  const sp = savingsProgress();
  return `<div class="card"><h2>🌱 적금 준비 기준</h2>
      <p>현재: 입금 ${sp.dc}번 · 통장 ${fmt(sp.b)} → ${sp.ready ? "<b>준비 완료!</b>" : "준비 중"}</p>
      <div class="grid2"><label class="fld"><span>입금 횟수</span><input class="inp" type="number" value="${S.savingsRule.deposits}" onchange="ruleSet('deposits',this.value)"></label>
      <label class="fld"><span>통장 최소 잔액(원)</span><input class="inp" type="number" value="${S.savingsRule.minBalance}" onchange="ruleSet('minBalance',this.value)"></label></div></div>
    <div class="card"><h2>📋 적금 통장 만들 때 준비물 (부모님)</h2>
      <p class="small">• 방문하는 부모님 신분증<br>• 가족관계증명서 (상세)<br>• 자녀 기준 기본증명서 (상세)<br>• 종이 통장이면 자녀 도장<br>• 서류는 <b>3개월 이내 발급</b>, 주민번호 뒷자리까지 모두 표시<br>• 만 14세 미만은 부모님과 함께 가야 해요. 은행 앱으로 비대면 개설이 되는 곳도 있어요.</p>
      <p class="small">💡 2주마다 2,000원처럼 나눠 넣으려면 <b>자유적립식 적금</b>이 잘 맞아요. 만기 후 목돈으로 예금에 도전하면 두 상품의 차이를 몸으로 배울 수 있어요.</p>
      <p class="small">금리 비교: <a href="https://finlife.fss.or.kr" target="_blank" rel="noopener">금융상품 한눈에 (금융감독원)</a></p></div>
    <div class="card"><h2>🏦 통장 관리</h2>
      <div class="tx"><span class="e">🏦</span><div class="grow">입출금 통장<div class="small muted">기본 통장</div></div><b class="jua">${fmt(bankEstimate("main").est)}</b></div>
      ${S.bank.products.map((p) => `<div class="tx"><span class="e">${p.type === "예금" ? "💎" : "🌟"}</span><div class="grow">${esc(p.name || p.type + " 통장")} <span class="small muted">${esc(p.bank)}</span><div class="small muted">${p.type}${p.rate ? " · 연 " + p.rate + "%" : ""}${p.end ? " · 만기 " + p.end : ""}</div></div><b class="jua">${fmt(bankEstimate(p.id).est)}</b><button class="chip" onclick="productEdit('${p.id}',null,true)">고치기</button></div>`).join("")}
      <div class="grid2" style="margin-top:8px"><button class="btn sec" onclick="productEdit(null,'적금',true)">🌟 적금 통장 추가</button><button class="btn sec" onclick="productEdit(null,'예금',true)">💎 예금 통장 추가</button></div></div>
    <p class="small muted">통장 사진 기록은 통장 탭에서 눌러 '부모님 확인'을 해 줄 수 있어요.</p>`;
}
function ruleSet(k, v) { commit((st) => (st.savingsRule[k] = Number(v) || 0)); }
// ---------- 예금·적금 통장 등록/수정 (부모님) ----------
let PE_BACK = false;
function productEdit(id, type, back) {
  PE_BACK = !!back;
  const p = S.bank.products.find((x) => x.id === id) || { type: type || "적금", bank: "", name: "", rate: "", monthly: "", start: today(), end: addDays(today(), 365) };
  const html = `${head(id ? "통장 정보 고치기" : `${p.type} 통장 추가`, back ? "parentPanel('bank')" : "")}
    <div class="grid2">
      <label class="fld"><span>종류</span><select id="bp_type" class="inp" onchange="document.getElementById('bp_mon').style.display=this.value==='적금'?'':'none'">${["적금", "예금"].map((t) => `<option ${p.type === t ? "selected" : ""}>${t}</option>`).join("")}</select></label>
      <label class="fld"><span>은행</span><input id="bp_bank" class="inp" value="${esc(p.bank)}" placeholder="예: OO은행"></label>
      <label class="fld"><span>통장 이름</span><input id="bp_name" class="inp" value="${esc(p.name)}" placeholder="예: 꿈나무 적금"></label>
      <label class="fld"><span>금리 (연 %)</span><input id="bp_rate" class="inp" type="number" step="0.01" value="${p.rate || ""}" placeholder="예: 3.5"></label>
      <label class="fld" id="bp_mon" style="${p.type === "적금" ? "" : "display:none"}"><span>매달 넣는 돈 (원, 자유적립이면 비워도 돼요)</span><input id="bp_monthly" class="inp" type="number" value="${p.monthly || ""}"></label>
      <label class="fld"><span>가입일</span><input id="bp_start" class="inp" type="date" value="${p.start || today()}"></label>
      <label class="fld"><span>만기일</span><input id="bp_end" class="inp" type="date" value="${p.end || ""}"></label>
      ${id ? "" : `<label class="fld"><span>지금 통장 잔액 (원)</span><input id="bp_bal" class="inp" type="number" placeholder="예: 1000000"></label>`}
    </div>
    ${id ? `<p class="small muted">잔액은 통장 탭의 📸 사진이나 ✍️ 잔액 버튼으로 넣어요.</p>` : `<p class="small muted">잔액을 지금 모르면 비워 두고, 나중에 통장 사진으로 넣어도 돼요.</p>`}
    <button class="btn wide ok" onclick="productSave('${id || ""}')">${id ? "저장" : "통장 추가 (캐릭터에 왕관이 생겨요 👑)"}</button>
    ${id ? `<div style="height:10px"></div><button class="btn bad wide" onclick="productDel('${id}')">이 통장 지우기</button>` : ""}`;
  document.querySelector(".modal") ? setModal(html) : openModal(html);
}
function productSave(id) {
  const v = (k) => ($("#" + k) ? $("#" + k).value.trim() : "");
  const d = { type: v("bp_type"), bank: v("bp_bank"), name: v("bp_name"), rate: Number(v("bp_rate")) || 0, monthly: v("bp_type") === "적금" ? Number(v("bp_monthly")) || 0 : 0, start: v("bp_start"), end: v("bp_end") };
  if (d.end && d.start && d.end < d.start) return toast("만기일이 가입일보다 빨라요");
  const bal0 = Number(v("bp_bal")) || 0;
  if (id) {
    commit((st) => { const p = st.bank.products.find((x) => x.id === id); if (p) Object.assign(p, d); });
    toast("저장했어요");
  } else {
    const p = { id: uid(), ...d };
    commit((st) => {
      st.bank.products.push(p);
      addBadge(st, "savings_open");
      addXP(st, "product:" + p.id, 50, p.type + " 통장 개설");
      if (bal0 > 0) { st.bank.records.push({ id: uid(), at: new Date().toISOString(), date: today(), account: p.id, balance: bal0, ai: null, photoId: null, rows: [], parentOk: true }); checkBankBadges(st, bal0); }
    });
    toast(`${d.type} 통장을 추가했어요! 🌟`);
  }
  PE_BACK ? parentPanel("bank") : closeModal();
}
function productDel(id) {
  if (!confirm("이 통장을 목록에서 지울까요? (통장 사진 기록도 함께 지워져요)")) return;
  commit((st) => { st.bank.products = st.bank.products.filter((x) => x.id !== id); st.bank.records = st.bank.records.filter((r) => r.account !== id); });
  PE_BACK ? parentPanel("bank") : closeModal();
}

function pSet() {
  return `<div class="card"><h2>👛 가진 돈</h2>
      <button class="btn sec wide" onclick="startMoney()">저금통 5개 잔액 다시 맞추기 (+ 통장 잔액)</button>
      <p class="small muted">실제 지갑·저금통에 있는 돈과 앱 숫자가 다를 때 써요. 차이만큼 '잔액 맞추기'로 기록돼요.</p></div>
    <div class="card"><h2>⚙️ 이 기기</h2>
      <label class="row"><input type="checkbox" ${isParentDevice() ? "checked" : ""} onchange="lsSet('yd_parentDevice',this.checked)" style="width:24px;height:24px"> 이 기기는 부모님 기기예요 (레벨업 이벤트·편지 팝업을 띄우지 않음)</label></div>
    <div class="card"><h2>🐣 캐릭터</h2><label class="fld"><span>캐릭터 이름</span><input class="inp" value="${esc(S.profile.nickname)}" onchange="nickSet(this.value)"></label>
      <div class="row"><span>XP 조정</span><button class="chip" onclick="xpAdj(-10)">−10</button><button class="chip" onclick="xpAdj(10)">+10</button><span class="muted">현재 ${S.xp} XP</span></div></div>
    <div class="card"><h2>🔐 비밀번호</h2>
      <button class="btn sec wide" onclick="commit(st=>st.parentPinHash='');toast('다음에 부모님 모드를 열 때 새로 정해요')">부모님 비밀번호(4자리) 다시 정하기</button>
      <div style="height:10px"></div>
      <label class="fld"><span>가족 비밀번호 바꾸기 (모든 기기에서 다시 넣어야 해요)</span><input id="newfam" class="inp" type="password" autocomplete="new-password"></label>
      <button class="btn sec wide" onclick="famChange()">가족 비밀번호 바꾸기</button></div>
    <div class="card"><h2>💾 백업</h2><button class="btn sec wide" onclick="backup()">기록 전체 파일로 내려받기 (JSON)</button>
      <p class="small muted">서버에도 날마다 자동 백업이 60일 동안 남아요.</p></div>`;
}
function nickSet(v) { commit((st) => (st.profile.nickname = v.trim().slice(0, 10))); }
function xpAdj(d) { commit((st) => { st.xp = Math.max(0, st.xp + d); st.xpLog.unshift({ at: new Date().toISOString(), amt: d, reason: "부모님 조정" }); }); parentPanel("set"); }
async function famChange() {
  const v = $("#newfam").value.trim();
  if (v.length < 4) return toast("4글자 이상");
  const r = await api("/api/setup", { method: "POST", body: { newCode: v } });
  if (r.status !== 200) return toast(r.data.error || "실패");
  CODE = v; lsSet("yd_code", v); toast("바꿨어요. 다른 기기에서는 새 비밀번호를 넣어 주세요");
}
function backup() {
  const blob = new Blob([JSON.stringify({ version: VER, state: S }, null, 1)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = `용돈기입장-백업-${today()}.json`; a.click();
}

boot();
