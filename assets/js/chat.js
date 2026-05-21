/* chat.js — 서버 없는 시맨틱 검색 (transformers.js + 사전 임베딩) */
const CDN = "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2";
const MODEL = "Xenova/multilingual-e5-small";
const TOPK = 4;

const log = document.getElementById("chatLog");
const input = document.getElementById("chatInput");
const sendBtn = document.getElementById("chatSend");
const status = document.getElementById("chatStatus");
const statusText = document.getElementById("chatStatusText");
const suggestWrap = document.getElementById("chatSuggest");

let extractor = null, chunks = null, vectors = null, loading = null;

const SUGGEST = [
  "발코니 확장비 얼마야?", "안양 1년 거주인데 1순위 가능해?", "중도금 대출 되나요?",
  "신혼부부 특별공급 소득 기준은?", "재당첨 제한 몇 년이야?", "입주는 언제야?",
];
suggestWrap.innerHTML = SUGGEST.map((s) => `<button>${s}</button>`).join("");
suggestWrap.querySelectorAll("button").forEach((b) =>
  b.addEventListener("click", () => { input.value = b.textContent; ask(); }));

addBot(`안녕하세요! 🌲 <strong>안양 에버포레 자연& e편한세상(A2BL)</strong> 입주자모집공고에 대해 궁금한 점을 물어보세요.<br>공고문 51페이지에서 가장 관련된 <strong>원문 조항</strong>을 찾아드립니다.`);

function setStatus(text, ready) {
  statusText.textContent = text;
  status.classList.toggle("ready", !!ready);
}

async function ensureLoaded() {
  if (extractor && vectors) return;
  if (loading) return loading;
  loading = (async () => {
    setStatus("검색 데이터 불러오는 중…");
    const [{ pipeline, env }, ch, emb] = await Promise.all([
      import(CDN),
      fetch("./data/chunks.json").then((r) => r.json()),
      fetch("./data/embeddings.json").then((r) => r.json()),
    ]);
    chunks = ch; vectors = emb.vectors;
    env.allowLocalModels = false; // HuggingFace 허브에서 모델 로드
    setStatus("AI 검색 모델 불러오는 중… (최초 1회 다운로드, 잠시만요)");
    extractor = await pipeline("feature-extraction", MODEL, { quantized: true });
    setStatus("검색 준비 완료 · 브라우저에서 동작 중", true);
  })();
  return loading;
}

function cosine(a, b) { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; }
const CAT_ICON = { price: "💰", option: "🏠", schedule: "📅", special: "🎁", income_asset: "📊", selection: "🎯", documents: "📑", loan_tax: "🏦", eligibility: "✅", movein: "🔑", overview: "🏢", notice: "ℹ️" };

async function ask() {
  const q = input.value.trim();
  if (!q) return;
  input.value = "";
  addUser(q);
  const thinking = addBot('<span class="typing"><span></span><span></span><span></span></span>');
  try {
    await ensureLoaded();
    const out = await extractor("query: " + q, { pooling: "mean", normalize: true });
    const qv = Array.from(out.data);
    const ranked = vectors.map((v, i) => [cosine(qv, v), i]).sort((x, y) => y[0] - x[0]);
    const top = ranked.slice(0, TOPK).filter((r) => r[0] > 0.78);
    thinking.remove();
    if (!top.length) {
      addBot("관련된 조항을 찾지 못했어요. 질문을 조금 더 구체적으로(예: ‘발코니 확장비’, ‘1순위 자격’) 적어주시겠어요?");
      return;
    }
    const best = chunks[top[0][1]];
    const cards = top.map(([score, i]) => {
      const c = chunks[i];
      return `<div class="src-item">
        <div class="meta"><span class="cat">${CAT_ICON[c.category] || ""} ${c.categoryLabel}</span> · 공고문 ${c.page}p <span class="score">유사도 ${(score * 100).toFixed(0)}%</span></div>
        <div>${escapeHtml(c.text).slice(0, 320)}${c.text.length > 320 ? "…" : ""}</div>
        <div style="margin-top:6px"><a href="./clauses/${c.file}" target="_blank" rel="noopener">관련 섹션 전체 보기 →</a></div>
      </div>`;
    }).join("");
    addBot(`<div class="bubble">‘<strong>${escapeHtml(q)}</strong>’ 관련 공고문 원문이에요. 가장 관련 높은 항목은 <strong>${best.categoryLabel}</strong>(공고문 ${best.page}p) 입니다.<div class="src">${cards}</div></div>`, true);
  } catch (err) {
    thinking.remove();
    addBot("검색 중 오류가 발생했어요. 네트워크 상태를 확인하고 다시 시도해 주세요.<br><small>" + escapeHtml(String(err)) + "</small>");
    setStatus("오류 — 다시 시도해 주세요", false);
  }
}

function addUser(t) { const el = div("msg user", escapeHtml(t)); scroll(); return el; }
function addBot(html, raw) {
  const el = document.createElement("div");
  el.className = "msg bot";
  el.innerHTML = raw ? html : `<div class="bubble">${html}</div>`;
  log.appendChild(el); scroll(); return el;
}
function div(cls, html) { const el = document.createElement("div"); el.className = cls; el.innerHTML = html; log.appendChild(el); return el; }
function scroll() { log.scrollTop = log.scrollHeight; }
function escapeHtml(s) { return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

sendBtn.addEventListener("click", ask);
input.addEventListener("keydown", (e) => { if (e.key === "Enter") ask(); });
