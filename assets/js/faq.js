/* faq.js — 자주 묻는 질문. announcement.json에서 전부 생성(프로젝트 독립적). */
document.addEventListener("data:ready", (e) => {
  const d = e.detail, { won, eok, fmtDate } = window.fmt;
  const prices = d.units.flatMap((u) => u.floors.map((f) => f.price));
  const minP = Math.min(...prices), maxP = Math.max(...prices);
  const ev = (id) => d.schedule.find((s) => s.id === id);
  const evTxt = (id) => { const x = ev(id); return x ? fmtDate(x.date) + (x.dateEnd ? `~${fmtDate(x.dateEnd)}` : "") : null; };
  const r = d.criteria.residency || {};

  // 일정 요약
  const order = ["notice", "special", "g1-local", "g1-other", "g1", "g2", "result", "docs", "contract"];
  const schedLine = d.schedule
    .map((s) => `${s.label} ${fmtDate(s.date)}${s.dateEnd ? `~${fmtDate(s.dateEnd)}` : ""}`)
    .join(" → ");

  // 발코니
  const bvals = d.options.balcony ? Object.values(d.options.balcony.byType) : [];
  const balconyLine = bvals.length
    ? (() => {
        const pay = d.options.balcony.payment || {};
        const payTxt = Object.entries(pay).map(([k, v]) => `${k} ${Math.round(v * 100)}%`).join(" + ");
        return `발코니 확장비는 타입별 ${won(Math.min(...bvals))} ~ ${won(Math.max(...bvals))} 수준입니다${payTxt ? ` (납부: ${payTxt})` : ""}. 단지에 따라 전 세대 확장형으로 시공(별도 계약)될 수 있으니 공고문을 확인하세요.`;
      })()
    : "발코니 확장 관련 사항은 공고문을 확인하세요.";

  const faqs = [
    ["청약 일정이 어떻게 되나요?",
      `${schedLine}. 자세한 내용은 <a href="#schedule">청약일정</a>을 보세요.`],
    ["분양가는 얼마인가요?",
      `타입·층에 따라 약 ${eok(minP)} ~ ${eok(maxP)} 수준입니다(발코니 확장·옵션 별도). <a href="#calc">분양가 계산기</a>에서 타입·층·옵션별 총액과 회차별 납부액을 확인할 수 있어요.`],
    ["일반공급 1순위 자격은?",
      `${d.criteria.rank1}${r.note ? " " + r.note : ""}`],
    ["거주지역 요건이 어떻게 되나요?",
      `${r.해당지역 ? `해당지역: ${r.해당지역}. ` : ""}${r.기타지역 ? `기타지역: ${r.기타지역}.` : ""} ${r.note || ""}`],
    ["발코니 확장은 필수인가요?", balconyLine],
    ["중도금 대출이 되나요?",
      "중도금은 정부 규제(LTV 등)·금융기관 사정에 따라 일부 범위에서 융자 알선될 수 있으며, 불가 시 자력 납부해야 할 수 있습니다. 자세한 내용은 <a href=\"#chat\">공고문 검색</a>에서 ‘중도금 대출’을 검색하세요."],
    ["재당첨·전매·거주의무 제한은?",
      `재당첨제한 ${d.meta.rules.재당첨제한} · 전매제한 ${d.meta.rules.전매제한} · 거주의무 ${d.meta.rules.거주의무} 입니다(${d.meta.priceCap || "분양가상한제"}).`],
    ["입주는 언제인가요?", `${d.meta.moveInPlan}입니다. 공정에 따라 변동될 수 있으며 정확한 시기는 추후 개별 안내됩니다.`],
    ["견본주택은 어디서 보나요?",
      d.meta.showHouse ? `${d.meta.showHouse.address}에서 ${d.meta.showHouse.period} 운영합니다. ${d.meta.showHouse.note || ""}` : "견본주택 안내는 공식 홈페이지를 확인하세요."],
  ];
  document.getElementById("faqList").innerHTML = faqs.map(([q, ans]) =>
    `<div class="faq-item"><div class="faq-q">${q}<span class="ar">▾</span></div><div class="faq-a">${ans}</div></div>`).join("");
  document.querySelectorAll(".faq-item").forEach((it) =>
    it.querySelector(".faq-q").addEventListener("click", () => it.classList.toggle("open")));
});
