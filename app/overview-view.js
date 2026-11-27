// National Pulse (#/) — Headline indicators, 10-year macro chart, CPI converter, and release calendar.

import { HEADLINE_KPIS, MACRO_DECADE, RELEASE_CALENDAR } from "./national-summary-data.js";
import { renderMacroComboSvg, renderSparklineSvg } from "./svg-charts.js";
import { downloadCsvFile, escapeHtml, formatSigned, formatYen } from "./export-utils.js";

export function renderOverviewView(state) {
  const mode = state.overviewMode || "gdp";
  const activeYear = Number(state.overviewYear || 2024);
  const yearRow = MACRO_DECADE.find((r) => r.year === activeYear) || MACRO_DECADE[MACRO_DECADE.length - 1];

  const baseYear = Number(state.calcFromYear || 2015);
  const targetYear = Number(state.calcToYear || 2024);
  const amountYen = Math.max(1000, Number(state.calcYen || 1000000));
  const baseRow = MACRO_DECADE.find((r) => r.year === baseYear) || MACRO_DECADE[0];
  const targetRow = MACRO_DECADE.find((r) => r.year === targetYear) || MACRO_DECADE[MACRO_DECADE.length - 1];
  const ratio = targetRow.cpiAllIdx / baseRow.cpiAllIdx;
  const adjustedYen = Math.round(amountYen * ratio);
  const cpiDeltaPct = (ratio - 1) * 100;
  const nominalWagePct = ((targetRow.nominalWageK - baseRow.nominalWageK) / baseRow.nominalWageK) * 100;

  const kpiCards = HEADLINE_KPIS.map((k) => {
    const badgeClass = k.tone === "up" ? "badge-up" : k.tone === "warn" ? "badge-warn" : k.tone === "ochre" ? "badge-ochre" : "badge-neutral";
    return `<a class="kpi-card" href="${k.route}">
      <div>
        <div class="kpi-top">
          <span class="kpi-domain">${escapeHtml(k.domain)}</span>
          <span class="badge ${badgeClass}">${escapeHtml(k.delta)}</span>
        </div>
        <div class="kpi-label">${escapeHtml(k.label)}</div>
      </div>
      <div class="kpi-mid">
        <span class="kpi-value">${escapeHtml(k.value)}</span>
        ${renderSparklineSvg(k.series, k.color)}
      </div>
      <div class="kpi-foot">
        <span>${escapeHtml(k.source)}</span>
        <strong>${escapeHtml(k.period)} →</strong>
      </div>
    </a>`;
  }).join("");

  return `
    <section class="context-banner" aria-label="National statistical summary context">
      <div class="context-headline">
        <h1>Japan National Statistical Pulse</h1>
        <span class="context-sub">Key economic, demographic, labor, and external balances with full survey provenance</span>
      </div>
      <div class="context-meta">
        <span class="badge badge-neutral">47 Prefectures</span>
        <span class="badge badge-ochre">Base CPI 2020=100</span>
        <a class="btn btn-subtle" href="#/catalog">Browse all 32 series →</a>
      </div>
    </section>

    <section class="kpi-grid" aria-label="Headline national indicators">${kpiCards}</section>

    <section class="split-deck">
      <article class="panel">
        <div class="panel-head">
          <div>
            <h2 class="panel-title">Ten-Year Macroeconomic &amp; Price Trajectory (2015–2024)</h2>
            <p class="panel-subtitle">Switch series view or inspect any calendar year for exact official accounts</p>
          </div>
          <div class="seg-group" role="tablist" aria-label="Macro chart view">
            <button class="seg-btn ${mode === "gdp" ? "is-active" : ""}" data-overview-mode="gdp" type="button">GDP &amp; Growth</button>
            <button class="seg-btn ${mode === "prices" ? "is-active" : ""}" data-overview-mode="prices" type="button">CPI &amp; Wages</button>
            <button class="seg-btn ${mode === "trade" ? "is-active" : ""}" data-overview-mode="trade" type="button">Trade Balance</button>
          </div>
        </div>
        <div class="chart-frame">${renderMacroComboSvg(MACRO_DECADE, mode, activeYear)}</div>
        <div class="year-scrubber">
          <div class="year-pills" aria-label="Select year to inspect">
            ${MACRO_DECADE.map((r) => `<button class="year-pill ${r.year === activeYear ? "is-active" : ""}" data-overview-year="${r.year}" type="button">${r.year}</button>`).join("")}
          </div>
          <div class="num">
            <strong>${yearRow.year}:</strong> GDP <strong>¥${yearRow.nominalGdpT.toFixed(1)}T</strong> (${formatSigned(yearRow.realGrowthPct, 1)} real) · Core CPI <strong>${formatSigned(yearRow.coreCpiPct, 1)}</strong> · Trade <strong>${yearRow.exportsT - yearRow.importsT >= 0 ? "+" : "-"}¥${Math.abs(yearRow.exportsT - yearRow.importsT).toFixed(2)}T</strong>
          </div>
        </div>
        <div class="source-line">
          <span>Sources: Cabinet Office ESRI, MIC CPI (2020=100), MHLW Labour, MOF Customs.</span>
          <button id="export-decade-csv" class="link-btn" type="button">Download 2015–2024 CSV</button>
        </div>
      </article>

      <div class="stack-col">
        <section class="panel" aria-labelledby="cpi-calc-heading">
          <div class="panel-head">
            <div>
              <h2 id="cpi-calc-heading" class="panel-title">Purchasing-Power &amp; CPI Adjuster</h2>
              <p class="panel-subtitle">Convert household yen values using official MIC All-Items CPI</p>
            </div>
            <a class="link-btn" href="#/economy">Full wage lab →</a>
          </div>
          <div class="calc-grid">
            <div>
              <label class="field-label" for="ov-calc-yen">Amount (JPY)</label>
              <input id="ov-calc-yen" class="field-input" type="number" min="1000" step="10000" value="${amountYen}" />
            </div>
            <div>
              <label class="field-label" for="ov-calc-from">From Year</label>
              <select id="ov-calc-from" class="field-select">
                ${MACRO_DECADE.map((r) => `<option value="${r.year}" ${r.year === baseYear ? "selected" : ""}>${r.year}</option>`).join("")}
              </select>
            </div>
            <div>
              <label class="field-label" for="ov-calc-to">To Year</label>
              <select id="ov-calc-to" class="field-select">
                ${MACRO_DECADE.map((r) => `<option value="${r.year}" ${r.year === targetYear ? "selected" : ""}>${r.year}</option>`).join("")}
              </select>
            </div>
          </div>
          <div class="calc-result-box">
            <div>
              <div class="field-label">CPI-Equivalent Value in ${targetYear}</div>
              <div class="calc-big num">${formatYen(adjustedYen)}</div>
            </div>
            <div style="text-align:right;font-size:11.5px">
              <div><strong>${formatSigned(cpiDeltaPct, 1)}</strong> cumulative CPI</div>
              <div style="color:var(--ink-500)">Nominal wages: ${formatSigned(nominalWagePct, 1)}</div>
            </div>
          </div>
          <div class="preset-row">
            <button class="chip-btn" data-yen-preset="330000" type="button">Monthly Wage ¥330k</button>
            <button class="chip-btn" data-yen-preset="95000" type="button">Tokyo Rent ¥95k</button>
            <button class="chip-btn" data-yen-preset="5000000" type="button">Household Deposit ¥5M</button>
          </div>
        </section>

        <section class="panel" aria-labelledby="release-cal-heading">
          <div class="panel-head" style="margin-bottom:6px">
            <div>
              <h2 id="release-cal-heading" class="panel-title">Official Statistical Releases</h2>
              <p class="panel-subtitle">Benchmark editions incorporated in this archive</p>
            </div>
          </div>
          <ul class="release-list">
            ${RELEASE_CALENDAR.map((item) => `<li class="release-item"><span class="release-date">${item.date}</span><span><strong>${escapeHtml(item.agency)}</strong> · <a href="${item.route}" style="color:inherit">${escapeHtml(item.title)}</a></span><span class="badge badge-up">${escapeHtml(item.status)}</span></li>`).join("")}
          </ul>
        </section>
      </div>
    </section>
  `;
}

export function bindOverviewInteractions(root, state, updateState) {
  root.querySelectorAll("[data-overview-mode]").forEach((btn) => {
    btn.addEventListener("click", () => updateState({ overviewMode: btn.getAttribute("data-overview-mode") }));
  });
  root.querySelectorAll("[data-overview-year]").forEach((btn) => {
    btn.addEventListener("click", () => updateState({ overviewYear: Number(btn.getAttribute("data-overview-year")) }));
  });
  const yenInput = root.querySelector("#ov-calc-yen");
  yenInput?.addEventListener("change", () => updateState({ calcYen: Math.max(1000, Number(yenInput.value) || 1000000) }));
  root.querySelector("#ov-calc-from")?.addEventListener("change", (e) => updateState({ calcFromYear: Number(e.target.value) }));
  root.querySelector("#ov-calc-to")?.addEventListener("change", (e) => updateState({ calcToYear: Number(e.target.value) }));
  root.querySelectorAll("[data-yen-preset]").forEach((btn) => {
    btn.addEventListener("click", () => updateState({ calcYen: Number(btn.getAttribute("data-yen-preset")) }));
  });
  root.querySelector("#export-decade-csv")?.addEventListener("click", () => {
    downloadCsvFile(
      "japan-macro-2015-2024.csv",
      ["Year", "Nominal_GDP_Trillion_JPY", "Real_GDP_YoY_Pct", "Core_CPI_YoY_Pct", "CPI_All_2020_100", "BOJ_Policy_Rate_Pct", "Exports_Trillion_JPY", "Imports_Trillion_JPY", "Real_Wage_YoY_Pct"],
      MACRO_DECADE.map((r) => [r.year, r.nominalGdpT, r.realGrowthPct, r.coreCpiPct, r.cpiAllIdx, r.bojRatePct, r.exportsT, r.importsT, r.realWageYoY]),
    );
  });
}