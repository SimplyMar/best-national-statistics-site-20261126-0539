// The overview page (#/): eight headline indicators, the "Japan at a glance" strip, the ten-year macro chart
// on the left; the prefecture map, the CPI purchasing-power adjuster and the release list on the right.
// Every number on it carries its source and period; the map's bubbles open the prefecture atlas.

import { HEADLINE_KPIS, MACRO_DECADE, RELEASE_CALENDAR } from "./national-summary-data.js";
import { PREFECTURES_47, REGION_METRICS } from "./prefectures-data.js";
import { renderMacroComboSvg, renderSparklineSvg } from "./svg-charts.js";
import { renderPrefectureBubbleMap } from "./japan-map.js";
import { downloadCsvFile, escapeHtml, formatSigned, formatYen } from "./export-utils.js";
import { renderGlanceStrip } from "./glance-strip.js";

/** The indicators the overview map can colour by, with the release each comes from. */
const MAP_CHOICES = [
  { key: "age65Pct", tab: "Aged 65+", source: "MIC Population Estimates, 1 Oct 2024" },
  { key: "popM", tab: "Population", source: "MIC Population Estimates, 1 Oct 2024" },
  { key: "gdpPerCapitaM", tab: "GDP / head", source: "Cabinet Office Prefectural Accounts, FY2021" },
  { key: "popChange5y", tab: "5-yr change", source: "MIC Population Estimates, 2019–2024" },
];

const MACRO_TABS = [
  { mode: "gdp", label: "GDP & Growth" },
  { mode: "prices", label: "CPI & Wages" },
  { mode: "trade", label: "Trade Balance" },
];

const YEN_PRESETS = [
  { yen: 330000, label: "Monthly wage ¥330k" },
  { yen: 95000, label: "Tokyo rent ¥95k" },
  { yen: 5000000, label: "Savings ¥5M" },
];

/** The CSS class of a KPI's change badge. */
function badgeClassFor(tone) {
  return { up: "badge-up", warn: "badge-warn", ochre: "badge-ochre" }[tone] ?? "badge-neutral";
}

/** One headline indicator card, linking to the page that explains it. */
function renderKpiCard(kpi) {
  return `<a class="kpi-card kpi-compact" href="${kpi.route}" title="${escapeHtml(kpi.domain)}">
    <div class="kpi-label">${escapeHtml(kpi.label)}</div>
    <div class="kpi-mid">
      <span class="kpi-value">${escapeHtml(kpi.value)}</span>
      ${renderSparklineSvg(kpi.series, kpi.color, 70, 26)}
    </div>
    <div class="kpi-change"><span class="badge ${badgeClassFor(kpi.tone)}">${escapeHtml(kpi.delta)}</span></div>
    <div class="kpi-foot"><span>${escapeHtml(kpi.source)}</span><strong>${escapeHtml(kpi.period)}</strong></div>
  </a>`;
}

/** The highest and lowest prefectures on a metric, for the line under the map. */
export function rankExtremes(metricKey) {
  const sorted = [...PREFECTURES_47].sort((a, b) => b[metricKey] - a[metricKey]);
  return { top: sorted[0], bottom: sorted[sorted.length - 1] };
}

/** The map panel: tabs for the colouring indicator, the bubble map, its extremes and source. */
function renderMapPanel(mapKey) {
  const choice = MAP_CHOICES.find((c) => c.key === mapKey) ?? MAP_CHOICES[0];
  const meta = REGION_METRICS[choice.key];
  const { top, bottom } = rankExtremes(choice.key);
  return `<section class="panel map-panel" aria-labelledby="ov-map-heading">
    <div class="panel-head">
      <div>
        <h2 id="ov-map-heading" class="panel-title">The 47 prefectures on the map</h2>
        <p class="panel-subtitle">Bubble size is population; colour is ${escapeHtml(meta.label.toLowerCase())}</p>
      </div>
    </div>
    <div class="seg-group map-tabs" role="tablist" aria-label="Map indicator">
      ${MAP_CHOICES.map((c) => `<button class="seg-btn ${c.key === choice.key ? "is-active" : ""}" data-overview-map="${c.key}" type="button" role="tab" aria-selected="${c.key === choice.key}">${c.tab}</button>`).join("")}
    </div>
    <div class="map-frame">${renderPrefectureBubbleMap(PREFECTURES_47, meta, { width: 420, height: 400, labelCount: 5, legend: false })}</div>
    <div class="map-legend-row">
      ${meta.palette.map((colour, index) => `<span><i style="background:${colour}"></i>${escapeHtml(meta.binLabels[index])}</span>`).join("")}
    </div>
    <p class="map-extremes num">Highest <strong>${escapeHtml(top.name)} ${escapeHtml(meta.format(top[choice.key]))}</strong> · lowest <strong>${escapeHtml(bottom.name)} ${escapeHtml(meta.format(bottom[choice.key]))}</strong> · Japan ${escapeHtml(meta.nationalMean)}</p>
    <div class="source-line"><span>${escapeHtml(choice.source)}</span><a class="link-btn" href="#/regions">Open the atlas →</a></div>
  </section>`;
}

/** The ten-year macro chart with its view tabs, year pills and the chosen year's figures. */
function renderMacroPanel(mode, activeYear) {
  const row = MACRO_DECADE.find((r) => r.year === activeYear) ?? MACRO_DECADE[MACRO_DECADE.length - 1];
  const balance = row.exportsT - row.importsT;
  return `<article class="panel macro-panel">
    <div class="panel-head">
      <div>
        <h2 class="panel-title">Ten years of the economy, 2015–2024</h2>
        <p class="panel-subtitle">Pick a view, then a year for its exact figures</p>
      </div>
      <div class="seg-group" role="tablist" aria-label="Macro chart view">
        ${MACRO_TABS.map((t) => `<button class="seg-btn ${t.mode === mode ? "is-active" : ""}" data-overview-mode="${t.mode}" type="button">${escapeHtml(t.label)}</button>`).join("")}
      </div>
    </div>
    <div class="chart-frame">${renderMacroComboSvg(MACRO_DECADE, mode, row.year)}</div>
    <div class="year-scrubber">
      <div class="year-pills" aria-label="Year to inspect">
        ${MACRO_DECADE.map((r) => `<button class="year-pill ${r.year === row.year ? "is-active" : ""}" data-overview-year="${r.year}" type="button">${r.year}</button>`).join("")}
      </div>
      <div class="num"><strong>${row.year}:</strong> GDP <strong>¥${row.nominalGdpT.toFixed(1)}T</strong> (${formatSigned(row.realGrowthPct, 1)} real) · core CPI <strong>${formatSigned(row.coreCpiPct, 1)}</strong> · trade <strong>${balance >= 0 ? "+" : "−"}¥${Math.abs(balance).toFixed(2)}T</strong></div>
    </div>
    <div class="source-line">
      <span>Cabinet Office ESRI (GDP), MIC (CPI 2020=100), MHLW (wages), MOF Customs (trade)</span>
      <button id="export-decade-csv" class="link-btn" type="button">Download 2015–2024 CSV</button>
    </div>
  </article>`;
}

/** What an amount of yen in one year is worth in another, by the all-items CPI. */
export function adjustForPrices(amountYen, fromYear, toYear) {
  const from = MACRO_DECADE.find((r) => r.year === fromYear) ?? MACRO_DECADE[0];
  const to = MACRO_DECADE.find((r) => r.year === toYear) ?? MACRO_DECADE[MACRO_DECADE.length - 1];
  const ratio = to.cpiAllIdx / from.cpiAllIdx;
  return {
    from,
    to,
    adjustedYen: Math.round(amountYen * ratio),
    cpiChangePct: (ratio - 1) * 100,
    wageChangePct: ((to.nominalWageK - from.nominalWageK) / from.nominalWageK) * 100,
  };
}

/** The purchasing-power adjuster: an amount, two years, the CPI-equivalent and how wages kept up. */
function renderCpiAdjuster(state) {
  const amountYen = Math.max(1000, Number(state.calcYen || 1000000));
  const fromYear = Number(state.calcFromYear || 2015);
  const toYear = Number(state.calcToYear || 2024);
  const result = adjustForPrices(amountYen, fromYear, toYear);
  const yearOptions = (selected) => MACRO_DECADE.map((r) => `<option value="${r.year}" ${r.year === selected ? "selected" : ""}>${r.year}</option>`).join("");
  const keptUp = result.wageChangePct >= result.cpiChangePct;
  return `<section class="panel" aria-labelledby="cpi-calc-heading">
    <div class="panel-head">
      <div>
        <h2 id="cpi-calc-heading" class="panel-title">What is ¥ worth now? CPI adjuster</h2>
        <p class="panel-subtitle">MIC all-items CPI, 2020 = 100</p>
      </div>
      <a class="link-btn" href="#/economy">Wage lab →</a>
    </div>
    <div class="calc-grid">
      <div><label class="field-label" for="ov-calc-yen">Amount (¥)</label><input id="ov-calc-yen" class="field-input" type="number" min="1000" step="10000" value="${amountYen}" /></div>
      <div><label class="field-label" for="ov-calc-from">In year</label><select id="ov-calc-from" class="field-select">${yearOptions(result.from.year)}</select></div>
      <div><label class="field-label" for="ov-calc-to">Worth in</label><select id="ov-calc-to" class="field-select">${yearOptions(result.to.year)}</select></div>
    </div>
    <div class="calc-result-box">
      <div><div class="field-label">Same buying power in ${result.to.year}</div><div class="calc-big num">${formatYen(result.adjustedYen)}</div></div>
      <div class="calc-compare">
        <div>Prices <strong>${formatSigned(result.cpiChangePct, 1)}</strong></div>
        <div>Wages <strong>${formatSigned(result.wageChangePct, 1)}</strong></div>
        <div class="${keptUp ? "calc-ok" : "calc-behind"}">${keptUp ? "Wages kept up" : "Wages fell behind"}</div>
      </div>
    </div>
    <div class="preset-row">${YEN_PRESETS.map((p) => `<button class="chip-btn" data-yen-preset="${p.yen}" type="button">${escapeHtml(p.label)}</button>`).join("")}</div>
  </section>`;
}

/** The official releases this edition includes, newest first. */
function renderReleaseList() {
  return `<section class="panel" aria-labelledby="release-cal-heading">
    <div class="panel-head"><div><h2 id="release-cal-heading" class="panel-title">Releases in this edition</h2><p class="panel-subtitle">The official publications behind the figures</p></div></div>
    <ul class="release-list">
      ${RELEASE_CALENDAR.map((item) => `<li class="release-item"><span class="release-date">${item.date}</span><span><strong>${escapeHtml(item.agency)}</strong> · <a href="${item.route}">${escapeHtml(item.title)}</a></span><span class="badge badge-up">${escapeHtml(item.status)}</span></li>`).join("")}
    </ul>
  </section>`;
}

/** The whole overview page for the current state. */
export function renderOverviewView(state) {
  const mode = state.overviewMode || "gdp";
  const year = Number(state.overviewYear || 2024);
  const mapKey = state.overviewMapMetric || "age65Pct";
  return `
    <section class="context-banner" aria-label="About this almanac">
      <div class="context-headline">
        <h1>Japan in figures</h1>
        <span class="context-sub">123.8 million people · 47 prefectures · ¥609 trillion economy — official statistics, each with its source and year</span>
      </div>
      <div class="context-meta"><a class="btn btn-subtle" href="#/catalog">All 32 series →</a></div>
    </section>
    <div class="pulse-deck">
      <div class="pulse-main">
        <section class="kpi-grid" aria-label="Headline national indicators">${HEADLINE_KPIS.map(renderKpiCard).join("")}</section>
        ${renderGlanceStrip()}
        ${renderMacroPanel(mode, year)}
      </div>
      <div class="pulse-side">
        ${renderMapPanel(mapKey)}
        ${renderCpiAdjuster(state)}
        ${renderReleaseList()}
      </div>
    </div>`;
}

/** Wire the overview's tabs, pills, map bubbles, adjuster and CSV button to the shared state. */
export function bindOverviewInteractions(root, state, updateState) {
  root.querySelectorAll("[data-overview-mode]").forEach((button) => {
    button.addEventListener("click", () => updateState({ overviewMode: button.getAttribute("data-overview-mode") }));
  });
  root.querySelectorAll("[data-overview-year]").forEach((button) => {
    button.addEventListener("click", () => updateState({ overviewYear: Number(button.getAttribute("data-overview-year")) }));
  });
  root.querySelectorAll("[data-overview-map]").forEach((button) => {
    button.addEventListener("click", () => updateState({ overviewMapMetric: button.getAttribute("data-overview-map") }));
  });
  root.querySelectorAll(".map-bubble").forEach((bubble) => {
    const openAtlas = () => {
      updateState({ selectedPref: bubble.getAttribute("data-pref-code"), regionMetric: state.overviewMapMetric || "age65Pct" });
      window.location.hash = "#/regions";
    };
    bubble.addEventListener("click", openAtlas);
    bubble.addEventListener("keydown", (event) => { if (event.key === "Enter") openAtlas(); });
  });
  const yenInput = root.querySelector("#ov-calc-yen");
  yenInput?.addEventListener("change", () => updateState({ calcYen: Math.max(1000, Number(yenInput.value) || 1000000) }));
  root.querySelector("#ov-calc-from")?.addEventListener("change", (event) => updateState({ calcFromYear: Number(event.target.value) }));
  root.querySelector("#ov-calc-to")?.addEventListener("change", (event) => updateState({ calcToYear: Number(event.target.value) }));
  root.querySelectorAll("[data-yen-preset]").forEach((button) => {
    button.addEventListener("click", () => updateState({ calcYen: Number(button.getAttribute("data-yen-preset")) }));
  });
  root.querySelector("#export-decade-csv")?.addEventListener("click", () => {
    downloadCsvFile(
      "japan-macro-2015-2024.csv",
      ["Year", "Nominal_GDP_Trillion_JPY", "Real_GDP_YoY_Pct", "Core_CPI_YoY_Pct", "CPI_All_2020_100", "BOJ_Policy_Rate_Pct", "Exports_Trillion_JPY", "Imports_Trillion_JPY", "Real_Wage_YoY_Pct"],
      MACRO_DECADE.map((r) => [r.year, r.nominalGdpT, r.realGrowthPct, r.coreCpiPct, r.cpiAllIdx, r.bojRatePct, r.exportsT, r.importsT, r.realWageYoY]),
    );
  });
}
