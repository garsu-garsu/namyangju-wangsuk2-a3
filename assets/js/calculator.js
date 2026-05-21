/* calculator.js — 분양가 + 발코니 + 시스템에어컨 합산, 회차별 납부 일정
   옵션 가격은 타입별로 다를 수 있고(priceByType), 옵션 납부조건도 프로젝트마다 다르므로
   각 옵션의 payment{계약금,중도금,잔금} 비율을 따라 계약금행/첫 중도금행/잔금행에 배분한다. */
document.addEventListener("data:ready", (e) => {
  const d = e.detail;
  const { won, eok, fmtDate } = window.fmt;
  const state = { type: d.units[0].type, floorIdx: 0, balcony: true, aircon: "" };

  const typeWrap = document.getElementById("calcType");
  const floorWrap = document.getElementById("calcFloor");
  const airconSel = document.getElementById("optAircon");
  const balconyChk = document.getElementById("optBalcony");
  const hasAircon = !!(d.options.aircon && d.options.aircon.items && d.options.aircon.items.length);

  typeWrap.innerHTML = d.units.map((u) =>
    `<button data-type="${u.type}">${u.type}${u.isModel ? " ★" : ""}</button>`).join("");

  function unit() { return d.units.find((u) => u.type === state.type); }
  function airconPrice(it, type) { return it.priceByType ? (it.priceByType[type] || 0) : (it.price || 0); }
  function airconAvail(it, type) { return it.priceByType ? (it.priceByType[type] > 0) : true; }
  function balconyPrice(type) {
    const b = d.options.balcony; if (!b) return 0;
    return (b.byType && b.byType[type]) || 0;
  }
  function housingFund(type) {
    const f = d.payment.잔금.housingFund;
    return typeof f === "object" && f !== null ? (f[type] || 0) : (f || 0);
  }

  function rebuildAircon() {
    if (!hasAircon) { airconSel.closest(".field").style.display = "none"; return; }
    const cur = state.aircon;
    airconSel.innerHTML = `<option value="">선택 안 함</option>`;
    let keep = false;
    d.options.aircon.items.filter((it) => airconAvail(it, state.type)).forEach((it) => {
      const o = document.createElement("option");
      o.value = it.id; o.textContent = `${it.label} (+${won(airconPrice(it, state.type))})`;
      if (it.id === cur) { o.selected = true; keep = true; }
      airconSel.appendChild(o);
    });
    if (!keep) state.aircon = "";
  }

  function renderFloors() {
    const u = unit();
    floorWrap.innerHTML = u.floors.map((f, i) =>
      `<button data-floor="${i}">${f.tier}</button>`).join("");
    floorWrap.querySelectorAll("button").forEach((b) =>
      b.classList.toggle("sel", +b.dataset.floor === state.floorIdx));
  }

  function optionRows(amount, pay) {
    // amount(옵션 총액)을 payment 비율에 따라 단계별로 나눈다
    if (!amount || !pay) return { 계약금: 0, 중도금: 0, 잔금: 0 };
    return { 계약금: amount * (pay.계약금 || 0), 중도금: amount * (pay.중도금 || 0), 잔금: amount * (pay.잔금 || 0) };
  }

  function compute() {
    const u = unit();
    const base = u.floors[state.floorIdx].price;
    const balcony = state.balcony ? balconyPrice(state.type) : 0;
    const airItem = hasAircon ? d.options.aircon.items.find((i) => i.id === state.aircon) : null;
    const aircon = airItem ? airconPrice(airItem, state.type) : 0;
    const total = base + balcony + aircon;

    const bSplit = optionRows(balcony, d.options.balcony && d.options.balcony.payment);
    const aSplit = optionRows(aircon, d.options.aircon && d.options.aircon.payment);
    const insts = d.payment.중도금.installments;
    const moveWhen = d.payment.잔금.when || "입주 시";

    const rows = [];
    rows.push({ stage: "계약금", when: "계약 시", base: base * d.payment.계약금.ratio, balcony: bSplit.계약금, aircon: aSplit.계약금 });
    insts.forEach((inst, i) => {
      rows.push({ stage: `중도금 ${inst.no}회`, when: fmtDate(inst.date),
        base: base * inst.ratio, balcony: i === 0 ? bSplit.중도금 : 0, aircon: i === 0 ? aSplit.중도금 : 0 });
    });
    rows.push({ stage: "잔금", when: moveWhen, base: base * d.payment.잔금.ratio, balcony: bSplit.잔금, aircon: aSplit.잔금 });

    return { base, balcony, aircon, total, rows, fund: housingFund(state.type) };
  }

  function render() {
    rebuildAircon();
    renderFloors();
    typeWrap.querySelectorAll("button").forEach((b) => b.classList.toggle("sel", b.dataset.type === state.type));
    const bp = balconyPrice(state.type);
    document.getElementById("balconyPrice").textContent = bp ? "+" + won(bp) : "해당 없음";
    if (!bp) balconyChk.checked = false;

    const c = compute();
    document.getElementById("calcTotal").textContent = eok(c.total);
    document.getElementById("calcBreak").innerHTML =
      `<span>분양가 ${won(c.base)}</span>` +
      (c.balcony ? `<span>+ 발코니 ${won(c.balcony)}</span>` : "") +
      (c.aircon ? `<span>+ 에어컨 ${won(c.aircon)}</span>` : "") +
      (c.fund ? `<span>· 잔금 중 주택도시기금 융자 가능 ${won(c.fund)}</span>` : "");

    const tb = document.getElementById("payTable");
    const head = `<tr><th>구분</th><th>납부 시기</th><th>분양가</th>${c.balcony ? "<th>발코니</th>" : ""}${c.aircon ? "<th>에어컨</th>" : ""}<th>합계</th></tr>`;
    const body = c.rows.map((r) => {
      const sum = r.base + r.balcony + r.aircon;
      return `<tr><td class="stage">${r.stage}</td><td style="text-align:left;color:var(--gray-500)">${r.when}</td>
        <td>${r.base ? won(Math.round(r.base)) : "-"}</td>
        ${c.balcony ? `<td>${r.balcony ? won(Math.round(r.balcony)) : "-"}</td>` : ""}
        ${c.aircon ? `<td>${r.aircon ? won(Math.round(r.aircon)) : "-"}</td>` : ""}
        <td><strong>${won(Math.round(sum))}</strong></td></tr>`;
    }).join("");
    const totalRow = `<tr class="sum"><td>총 합계</td><td></td><td>${won(c.base)}</td>${c.balcony ? `<td>${won(c.balcony)}</td>` : ""}${c.aircon ? `<td>${won(c.aircon)}</td>` : ""}<td>${won(c.total)}</td></tr>`;
    tb.innerHTML = head + body + totalRow;
  }

  typeWrap.addEventListener("click", (ev) => {
    const b = ev.target.closest("button"); if (!b) return;
    state.type = b.dataset.type; state.floorIdx = 0;
    if (balconyPrice(state.type)) balconyChk.checked = state.balcony = true;
    render();
  });
  floorWrap.addEventListener("click", (ev) => {
    const b = ev.target.closest("button"); if (!b) return;
    state.floorIdx = +b.dataset.floor; render();
  });
  balconyChk.addEventListener("change", () => { state.balcony = balconyChk.checked; render(); });
  airconSel.addEventListener("change", () => { state.aircon = airconSel.value; render(); });

  render();
});
