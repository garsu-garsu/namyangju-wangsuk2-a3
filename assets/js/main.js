/* main.js — 공통 데이터 로딩 + 단지정보/일정/D-day/네비 */
const won = (n) => n.toLocaleString("ko-KR") + "원";
const eok = (n) => {
  const e = Math.floor(n / 100000000);
  const man = Math.round((n % 100000000) / 10000);
  return (e ? e + "억 " : "") + (man ? man.toLocaleString("ko-KR") + "만" : "") + "원";
};
const fmtDate = (iso) => {
  const d = new Date(iso + "T00:00:00");
  const wd = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}(${wd})`;
};

// 모든 모듈이 공유하는 데이터 로딩 프라미스
window.dataReady = fetch("./data/announcement.json").then((r) => r.json());
window.fmt = { won, eok, fmtDate };

window.dataReady.then((data) => {
  window.__DATA = data;
  renderAds(data.meta);
  renderHero(data);
  renderInfo(data);
  renderShow(data);
  renderTimeline(data);
  renderCountdown(data);
  document.dispatchEvent(new CustomEvent("data:ready", { detail: data }));
});

/* Google AdSense — meta.adsense.client(ca-pub-…)가 있을 때만 동작.
   slots(inContent1/inContent2)가 있으면 본문 광고 유닛, 없으면 자동광고(대시보드 설정)로 노출. */
function renderAds(m) {
  const ad = m && m.adsense;
  if (!ad || !ad.client) return;
  const loader = document.createElement("script");
  loader.async = true;
  loader.crossOrigin = "anonymous";
  loader.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + ad.client;
  document.head.appendChild(loader);
  const slots = ad.slots || {};
  const place = (afterId, slotId) => {
    const sec = document.getElementById(afterId);
    if (!sec || !slotId) return;
    const wrap = document.createElement("div");
    wrap.className = "ad-wrap wrap";
    wrap.innerHTML = `<ins class="adsbygoogle" style="display:block" data-ad-client="${ad.client}" data-ad-slot="${slotId}" data-ad-format="auto" data-full-width-responsive="true"></ins>`;
    sec.after(wrap);
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
  };
  place("info", slots.inContent1);
  place("calc", slots.inContent2);
}

fetch("./data/clauses.json").then((r) => r.json()).then(renderClauses).catch(() => {});

function renderHero(d) {
  const m = d.meta;
  const sub = document.getElementById("heroSub");
  if (sub) sub.textContent = m.heroSubtitle || "";
  const tl = document.getElementById("transportList");
  if (tl && Array.isArray(m.transport)) {
    tl.innerHTML = m.transport.map((t) =>
      `<div class="tp"><div class="tp-ic">${t.icon || "📍"}</div><div><div class="tp-t">${t.title}</div><div class="tp-d">${t.desc || ""}</div></div></div>`).join("");
  }
  const dom = (u) => (u || "").replace(/^https?:\/\//, "").replace(/\/$/, "");
  const ftTop = document.getElementById("ftTop");
  if (ftTop) ftTop.textContent = `${m.leafEmoji || "🏢"} ${m.projectName} (${m.block})`;
  const ftc = document.getElementById("ftContact");
  if (ftc) ftc.textContent = `분양 문의(견본주택) ☎ ${m.consultTel} · 청약 상담은 청약 콜센터 이용`;
  const fts = document.getElementById("ftSites");
  if (fts) fts.innerHTML = `공식 홈페이지 <a href="${m.officialSite}" target="_blank" rel="noopener">${dom(m.officialSite)}</a> · 청약 <a href="${m.applyHome}" target="_blank" rel="noopener">${dom(m.applyHome)}</a>`;
  document.getElementById("heroMeta").innerHTML = [
    ["📍 위치", m.shortLocation || m.location],
    ["🏢 규모", `${m.scale} · ${m.totalHouseholds}세대`],
    ["📐 전용", m.exclusiveArea],
    ["🏗️ 입주", m.moveInPlan],
  ].map(([k, v]) => `<div><span class="k">${k}</span>&nbsp;<strong>${v}</strong></div>`).join("");
}

function renderInfo(d) {
  const m = d.meta;
  document.getElementById("infoCards").innerHTML = [
    ["🏠", "공급규모", `${m.totalHouseholds}세대`, m.exclusiveArea],
    ["🏷️", "분양 유형", "공공분양", m.priceCap],
    ["⛔", "전매제한", d.meta.rules.전매제한, `재당첨제한 ${m.rules.재당첨제한}`],
    ["🏗️", "입주 예정", "2028.08", "공정에 따라 변동"],
  ].map(([ic, t, big, mu]) => `<div class="card"><div class="icon-badge">${ic}</div><div class="muted">${t}</div><div class="big">${big}</div><div class="muted">${mu}</div></div>`).join("");

  const rows = [
    ["단지명", m.projectName + ` (${m.block})`],
    ["주택 유형", m.housingType + " · " + m.exclusiveArea],
    ["공급 위치", m.location],
    ["공급 규모", m.scale + ", 총 " + m.totalHouseholds + "세대"],
    ["규제 지역", m.regulation + " / 분양가상한제 적용 / 택지: " + m.landType],
    ["재당첨·전매·거주의무", `재당첨제한 ${m.rules.재당첨제한} · 전매제한 ${m.rules.전매제한} · 거주의무 ${m.rules.거주의무}`],
    ["사업주체", `공공시행 ${m.developer.공공시행자} / 민간 ${m.developer.민간사업자.join(", ")}`],
    ["주택관리번호", m.managementNumber],
    ["문의", `견본주택 ☎ ${m.consultTel} · 공식 ${m.officialSite}`],
  ];
  document.getElementById("infoTable").innerHTML = rows
    .map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join("");
}

function renderShow(d) {
  const s = d.meta.showHouse;
  document.getElementById("showTable").innerHTML = [
    ["주소", s.address],
    ["관람 기간", s.period],
    ["관람 시간", s.hours],
    ["견본세대", "84D 타입 (그 외 타입은 공식 홈페이지 VR 참고)"],
    ["유의", s.note],
  ].map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join("");
}

function renderTimeline(d) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const next = nextEvent(d.schedule, today);
  document.getElementById("timeline").innerHTML = d.schedule.map((ev) => {
    const dt = new Date(ev.date + "T00:00:00");
    const done = dt < today;
    const isNext = next && ev.id === next.id;
    const range = ev.dateEnd ? ` ~ ${fmtDate(ev.dateEnd)}` : "";
    return `<div class="tl-item ${done ? "done" : ""} ${isNext ? "next" : ""}">
      <div class="dot"></div>
      <div class="date">${fmtDate(ev.date)}${range}${isNext ? '<span class="badge-next">다음 일정</span>' : ""}</div>
      <div class="ev">${ev.label}</div>
      <div class="nt">${ev.note || ""}</div>
    </div>`;
  }).join("");
}

function nextEvent(schedule, today) {
  return schedule.find((ev) => new Date((ev.dateEnd || ev.date) + "T00:00:00") >= today) || null;
}

function renderCountdown(d) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const next = nextEvent(d.schedule, today);
  const box = document.getElementById("countdown");
  if (!next) return;
  const dt = new Date(next.date + "T00:00:00");
  const diff = Math.round((dt - today) / 86400000);
  box.hidden = false;
  document.getElementById("ddayNum").innerHTML = diff > 0 ? `D-${diff}` : diff === 0 ? "D-DAY" : `D+${-diff}`;
  document.getElementById("ddayDate").textContent = fmtDate(next.date) + (next.dateEnd ? ` ~ ${fmtDate(next.dateEnd)}` : "");
  document.getElementById("ddayLabel").textContent = next.label;
}

function renderClauses(list) {
  const wrap = document.getElementById("clauseCards");
  if (!wrap) return;
  const icons = { price: "💰", option: "🏠", schedule: "📅", special: "🎁", income_asset: "📊", selection: "🎯", documents: "📑", loan_tax: "🏦", eligibility: "✅", movein: "🔑", overview: "🏢", notice: "ℹ️" };
  wrap.innerHTML = list.map((c) => `<a class="card" href="./clause.html?id=${c.id}" style="display:block;text-decoration:none">
    <div class="icon-badge">${icons[c.id] || "📄"}</div>
    <h3>${c.title}</h3>
    <div class="muted">공고문 ${c.pages[0]}–${c.pages[1]}p · ${c.blocks}개 조항</div>
    <div style="margin-top:10px;font-size:.82rem;color:var(--forest-600);font-weight:700">자세히 보기 →</div>
  </a>`).join("");
}

/* 네비게이션: 모바일 토글 + 스크롤 활성 표시 */
const toggle = document.querySelector(".nav-toggle");
const links = document.querySelector(".nav-links");
toggle.addEventListener("click", () => links.classList.toggle("open"));
links.addEventListener("click", (e) => { if (e.target.tagName === "A") links.classList.remove("open"); });

const navAnchors = [...document.querySelectorAll(".nav-links a")];
const secs = navAnchors.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
const obs = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (en.isIntersecting) {
      navAnchors.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id));
    }
  });
}, { rootMargin: "-45% 0px -50% 0px" });
secs.forEach((s) => obs.observe(s));
