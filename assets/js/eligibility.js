/* eligibility.js — 청약자격 셀프체크 위저드 (참고용) */
document.addEventListener("data:ready", (e) => {
  const d = e.detail;
  const C = d.criteria;
  const body = document.getElementById("wzBody");
  const bar = document.getElementById("wzBar");
  const a = {}; // answers
  let step = 0;

  // 동적 질문 정의. show(a)가 false면 건너뜀.
  const Q = [
    { key: "resi", q: "현재 거주지가 어디인가요?", help: "입주자모집공고일 기준 거주지·거주기간으로 판단합니다.",
      opts: [
        [(C.residency && C.residency.해당지역) || "해당지역(주택건설지역) 거주", "home"],
        [(C.residency && C.residency.기타지역) || "그 외 수도권(서울·인천·경기) 거주", "metro"],
        ["수도권(서울·인천·경기) 밖 거주", "out"],
      ] },
    { key: "noHouse", q: "세대구성원 전원이 무주택인가요?", help: "본인·배우자 및 등본상 직계존비속 모두 주택·분양권을 소유하지 않아야 합니다.",
      opts: [["네, 전원 무주택입니다", "y"], ["아니요, 주택/분양권 보유자가 있습니다", "n"]] },
    { key: "savings", q: "주택청약종합저축 가입 상태는?", help: C.rank1 || "공공분양 국민주택 청약통장 요건",
      opts: [
        ["1순위 요건 충족 (" + (C.rank1 || "1순위 가입·납입 요건 충족").replace(/\(.*$/, "").slice(0, 40) + ")", "s24"],
        ["가입했지만 1순위 요건에 못 미침 (6회 이상)", "s6"],
        ["미가입 또는 6회 미만", "s0"],
      ] },
    { key: "special", q: "해당되는 특별공급 유형이 있나요?", help: "하나만 선택하세요. 없으면 ‘해당 없음(일반공급만)’.",
      opts: [
        ["다자녀가구", "다자녀가구"], ["신혼부부", "신혼부부"], ["생애최초", "생애최초"],
        ["노부모부양", "노부모부양"], ["신생아", "신생아"], ["해당 없음 (일반공급만)", "none"],
      ] },
    { key: "famSize", q: "세대원 수는?", help: "본인 포함 세대 구성원 수입니다.",
      show: (a) => a.special && a.special !== "none",
      opts: [["3인 이하", "3인이하"], ["4인", "4인"], ["5인", "5인"], ["6인", "6인"], ["7인", "7인"], ["8인", "8인"]] },
    { key: "income", q: "세대 월평균소득(세전)은 대략 얼마인가요?", help: "만원 단위로 입력하세요. (예: 700만원 → 700)",
      show: (a) => a.special && a.special !== "none",
      input: { unit: "만원", placeholder: "예: 700" } },
    { key: "dual", q: "맞벌이 세대인가요?", help: "본인과 배우자 모두 소득이 있으면 ‘맞벌이’.",
      show: (a) => a.special && a.special !== "none",
      opts: [["맞벌이 (둘 다 소득 있음)", "y"], ["외벌이/홑벌이", "n"]] },
    { key: "asset", q: "자산 기준을 충족하나요?", help: `부동산(건물+토지) ${won(C.asset.부동산)} 이하 & 자동차 ${won(C.asset.자동차)} 이하`,
      show: (a) => a.special && a.special !== "none" && a.special !== "기관추천",
      opts: [["네, 둘 다 기준 이하입니다", "y"], ["아니요/잘 모르겠어요", "n"]] },
  ];

  function visible() { return Q.filter((q) => !q.show || q.show(a)); }

  function render() {
    const list = visible();
    if (step >= list.length) return renderResult();
    const q = list[step];
    bar.style.width = ((step) / (list.length)) * 100 + "%";
    let inner = `<div class="wz-q">${q.q}</div><div class="wz-help">${q.help || ""}</div>`;
    if (q.input) {
      inner += `<div class="wz-opts"><input type="number" id="wzInput" placeholder="${q.input.placeholder}" value="${a[q.key] || ""}" style="font-size:1.1rem;padding:14px" /> <span style="color:var(--gray-500)">${q.input.unit}</span>
        <button class="wz-go" style="margin-top:10px">다음 →</button></div>`;
    } else {
      inner += `<div class="wz-opts">` + q.opts.map((o) =>
        `<button data-val="${o[1]}">${o[0]}</button>`).join("") + `</div>`;
    }
    inner += `<div class="wz-nav"><button id="wzBack" ${step === 0 ? "style='visibility:hidden'" : ""}>← 이전</button><button id="wzReset">처음부터</button></div>`;
    body.innerHTML = inner;

    body.querySelectorAll(".wz-opts button[data-val]").forEach((b) =>
      b.addEventListener("click", () => { a[q.key] = b.dataset.val; step++; render(); }));
    const go = body.querySelector(".wz-go");
    if (go) go.addEventListener("click", () => {
      const v = body.querySelector("#wzInput").value;
      if (!v) return; a[q.key] = +v; step++; render();
    });
    body.querySelector("#wzBack")?.addEventListener("click", () => { step = Math.max(0, step - 1); render(); });
    body.querySelector("#wzReset")?.addEventListener("click", () => { step = 0; for (const k in a) delete a[k]; render(); });
  }

  function renderResult() {
    bar.style.width = "100%";
    const items = [];
    let cls = "ok", title = "", lead = "";

    // 1) 거주 요건
    if (a.resi === "out") {
      cls = "no"; title = "청약 대상이 아닐 수 있어요";
      lead = "이 단지는 수도권(서울·인천·경기) 거주자에게 공급됩니다. 수도권 밖 거주자는 청약 대상에서 제외됩니다.";
      items.push(["✕", "거주 요건", "수도권(서울·인천·경기) 거주자가 아닙니다."]);
      return paint(cls, title, lead, items);
    }
    const region = a.resi === "home" ? "해당지역 (우선공급 대상)" : "기타지역 (수도권)";
    items.push(["✓", "거주 구분", region]);

    // 2) 무주택
    if (a.noHouse === "n") {
      cls = "warn"; title = "무주택 요건을 확인하세요";
      lead = "세대구성원 전원이 무주택이어야 일반/특별공급 신청이 원칙적으로 가능합니다. 다만 혼인·출산 특례 등 예외가 있을 수 있으니 공고문을 확인하세요.";
      items.push(["!", "무주택 요건", "세대 내 주택/분양권 보유자가 있어 제한될 수 있습니다."]);
    } else {
      items.push(["✓", "무주택 요건", "세대구성원 전원 무주택"]);
    }

    // 3) 일반공급 순위
    let rank = "";
    if (a.savings === "s24") { rank = "일반공급 1순위 가능"; items.push(["✓", "일반공급 순위", rank + " (1순위 통장요건 충족)"]); }
    else if (a.savings === "s6") { rank = "일반공급 2순위"; items.push(["!", "일반공급 순위", "1순위 통장요건 미달 → 2순위로 신청 가능"]); }
    else { rank = "통장 요건 미충족"; items.push(["✕", "일반공급 순위", "청약통장 6회 이상 납입이 필요합니다."]); cls = cls === "ok" ? "warn" : cls; }

    // 4) 특별공급
    if (a.special && a.special !== "none") {
      const sp = C.specialSupply.find((s) => s.type === a.special);
      const reasons = [];
      let spOk = a.noHouse === "y";
      if (a.noHouse !== "y") reasons.push("세대 무주택 요건");
      // 통장
      const needSavings = a.special === "노부모부양" ? "s24" : "s6";
      const savingsOk = a.savings === "s24" || (needSavings === "s6" && a.savings === "s6");
      if (!savingsOk) { spOk = false; reasons.push(`청약통장(${sp.savings})`); }
      // 소득
      if (sp.income != null && a.income && a.famSize) {
        const base = C.incomeBase100[a.famSize];
        const limitPct = a.dual === "y" ? sp.incomeDual : sp.income;
        const limit = base * limitPct / 100;
        const inc = a.income * 10000;
        if (inc > limit) { spOk = false; reasons.push(`월평균소득 ${limitPct}% 이하(${won(Math.round(limit))})`); }
        items.push([inc <= limit ? "✓" : "✕", `${a.special} 소득기준`, `기준 ${limitPct}% = ${won(Math.round(limit))} / 입력 ${won(inc)}`]);
      }
      // 자산
      if (sp.asset && a.asset === "n") { spOk = false; reasons.push("자산기준(부동산·자동차)"); }
      else if (sp.asset) { items.push(["✓", `${a.special} 자산기준`, "부동산·자동차 기준 이하"]); }

      if (spOk) items.push(["✓", `${a.special} 특별공급`, "신청 가능성이 있습니다 👍"]);
      else { items.push(["!", `${a.special} 특별공급`, "미충족 항목: " + reasons.join(", ")]); if (cls === "ok") cls = "warn"; }
    }

    title = cls === "ok" ? "신청 가능성이 높아요! 🎉" : cls === "warn" ? "일부 항목을 확인하세요" : "신청이 어려울 수 있어요";
    lead = `예상 결과: <strong>${rank}</strong>${a.special && a.special !== "none" ? ` · ${a.special} 특별공급 검토` : ""}`;
    paint(cls, title, lead, items);
  }

  function paint(cls, title, lead, items) {
    body.innerHTML = `<div class="result-box ${cls}">
      <h3>${title}</h3><div>${lead}</div>
      <div class="result-list">${items.map(([mk, k, v]) =>
        `<div class="ri"><span class="mk" style="color:${mk === "✓" ? "var(--forest-600)" : mk === "✕" ? "var(--danger)" : "var(--gold)"}">${mk}</span><div><strong>${k}</strong> — ${v}</div></div>`).join("")}</div>
    </div>
    <div class="disclaimer"><strong>참고용 안내입니다.</strong> 실제 청약 자격·순위는 세대 구성, 통장 가입일, 소득·자산 전산조회 등 세부 요건에 따라 달라집니다. 정확한 판단은 공식 입주자모집공고문과 청약홈을 확인하세요. 궁금한 점은 <a href="#chat">공고문 AI 검색</a>에서 물어보세요.</div>
    <div class="wz-nav"><button id="wzBack">← 이전</button><button id="wzReset">처음부터</button></div>`;
    body.querySelector("#wzBack").addEventListener("click", () => { step = Math.max(0, visible().length - 1); render(); });
    body.querySelector("#wzReset").addEventListener("click", () => { step = 0; for (const k in a) delete a[k]; render(); });
  }

  function won(n) { return window.fmt.won(n); }
  render();
});
