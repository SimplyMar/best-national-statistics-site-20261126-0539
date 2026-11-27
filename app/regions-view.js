// 47-Prefecture Statistical Atlas (#/regions) — Interactive SVG Choropleth, 3-Way Comparator, and Sortable Register.

import { PREFECTURES_47, REGION_METRICS } from "./prefectures-data.js";
import { renderJapanChoroplethSvg } from "./svg-charts.js";
import { downloadCsvFile, escapeHtml } from "./export-utils.js";

const REGIONS = ["All", "Hokkaido", "Tohoku", "Kanto", "Chubu", "Kansai", "Chugoku", "Shikoku", "Kyushu", "Okinawa"];

export function renderRegionsView(state) {
  const metricKey = REGION_METRICS[state.regionMetric] ? state.regionMetric : "gdpPerCapitaM";
  const metricMeta = REGION_METRICS[metricKey];
  const selectedCode = state.selectedPref || "13";
  const cmpA = state.compareA || "13"; // Tokyo
  const cmpB = state.compareB || "23"; // Aichi
  const cmpC = state.compareC || "47"; // Okinawa
  const regionFilter = state.regionBloc || "All";
  const search = (state.regionSearch || "").trim().toLowerCase();
  const sortBy = state.regionSort || metricKey;
  const sortDir = state.regionSortDir || "desc";

  const selectedPref = PREFECTURES_47.find((p) => p.code === selectedCode) || PREFECTURES_47[12];
  const comparePrefs = [cmpA, cmpB, cmpC].map((c) => PREFECTURES_47.find((p) => p.code === c) || PREFECTURES_47[0]);

  const filtered = PREFECTURES_47.filter((p) => {
    if (regionFilter !== "All" && p.region !== regionFilter) return false;
    if (search && !p.name.toLowerCase().includes(search) && !p.sector.toLowerCase().includes(search) && !p.short.toLowerCase().includes(search)) return false;
    return true;
  }).sort((a, b) => {
    const av = a[sortBy];
    const bv = b[sortBy];
    if (typeof av === "string") return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    return sortDir === "asc" ? av - bv : bv - av;
  });

  const prefOptions = (active) =>
    PREFECTURES_47.map((p) => `<option value="${p.code}" ${p.code === active ? "selected" : ""}>${p.code} ${escapeHtml(p.name)}</option>`).join("");

  return `
    <section class="toolbar-strip" aria-label="Prefectural map controls">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <strong style="font-family:var(--font-serif);font-size:15px">47-Prefecture Statistical Atlas</strong>
        <div class="seg-group" role="tablist" aria-label="Choropleth metric">
          <button class="seg-btn ${metricKey === "gdpPerCapitaM" ? "is-active" : ""}" data-reg-metric="gdpPerCapitaM" type="button">GDP / Capita</button>
          <button class="seg-btn ${metricKey === "popM" ? "is-active" : ""}" data-reg-metric="popM" type="button">Population</button>
          <button class="seg-btn ${metricKey === "age65Pct" ? "is-active" : ""}" data-reg-metric="age65Pct" type="button">Aged 65+ %</button>
          <button class="seg-btn ${metricKey === "popChange5y" ? "is-active" : ""}" data-reg-metric="popChange5y" type="button">5-Yr Change</button>
          <button class="seg-btn ${metricKey === "jobRatio" ? "is-active" : ""}" data-reg-metric="jobRatio" type="button">Job Ratio</button>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap">
        <select id="reg-bloc-select" class="field-select" style="width:auto;font-family:var(--font-sans)">
          ${REGIONS.map((r) => `<option value="${r}" ${r === regionFilter ? "selected" : ""}>${r === "All" ? "All 8 Regions (47)" : r}</option>`).join("")}
        </select>
        <input id="reg-search-input" class="field-input" style="width:155px;font-family:var(--font-sans)" type="search" placeholder="Filter prefecture…" value="${escapeHtml(state.regionSearch || "")}" />
        <button id="export-pref-csv" class="btn btn-primary" type="button">Export 47 CSV</button>
      </div>
    </section>

    <section class="split-atlas">
      <article class="panel">
        <div class="chart-frame">
          ${renderJapanChoroplethSvg(PREFECTURES_47, metricMeta, selectedCode, [cmpA, cmpB, cmpC])}
        </div>
        <div class="source-line">
          <span>Click any prefecture tile to inspect · National benchmark: <strong>${metricMeta.nationalMean}</strong></span>
          <span>MIC Oct 2024 &amp; Cabinet Office SNA</span>
        </div>
      </article>

      <div class="stack-col">
        <section class="panel">
          <div class="panel-head" style="margin-bottom:6px">
            <div>
              <span class="kpi-domain">Selected Prefecture ·JIS JP-${selectedPref.code} (${escapeHtml(selectedPref.region)})</span>
              <h2 class="panel-title" style="font-size:18px">${escapeHtml(selectedPref.name)} — ${escapeHtml(selectedPref.sector)}</h2>
            </div>
            <button class="btn btn-subtle" id="pin-to-slot-b" type="button">Pin to Compare</button>
          </div>
          <div class="mini-kpi-strip" style="margin-bottom:4px">
            <div class="mini-kpi">
              <div class="mini-kpi-label">Population</div>
              <div class="mini-kpi-val num">${selectedPref.popM.toFixed(2)}M</div>
              <div class="mini-kpi-sub">${selectedPref.popChange5y > 0 ? "+" : ""}${selectedPref.popChange5y.toFixed(1)}% (5y)</div>
            </div>
            <div class="mini-kpi">
              <div class="mini-kpi-label">GDP / Capita</div>
              <div class="mini-kpi-val num">¥${selectedPref.gdpPerCapitaM.toFixed(2)}M</div>
              <div class="mini-kpi-sub">${((selectedPref.gdpPerCapitaM / 4.85) * 100).toFixed(0)} (JP=100)</div>
            </div>
            <div class="mini-kpi">
              <div class="mini-kpi-label">Share 65+</div>
              <div class="mini-kpi-val num">${selectedPref.age65Pct.toFixed(1)}%</div>
              <div class="mini-kpi-sub">JP avg 29.3%</div>
            </div>
            <div class="mini-kpi">
              <div class="mini-kpi-label">Jobs / App</div>
              <div class="mini-kpi-val num">${selectedPref.jobRatio.toFixed(2)}x</div>
              <div class="mini-kpi-sub">MHLW 2024</div>
            </div>
          </div>
        </section>

        <section class="panel">
          <div class="panel-head" style="margin-bottom:7px">
            <div>
              <h2 class="panel-title">Three-Prefecture Head-to-Head Benchmark</h2>
              <p class="panel-subtitle">Compare metropolitan, industrial, and regional prefectures side by side</p>
            </div>
          </div>
          <div class="compare-slots">
            <div>
              <label class="field-label" for="cmp-sel-a">Prefecture A</label>
              <select id="cmp-sel-a" class="field-select" style="font-family:var(--font-sans)">${prefOptions(cmpA)}</select>
            </div>
            <div>
              <label class="field-label" for="cmp-sel-b">Prefecture B</label>
              <select id="cmp-sel-b" class="field-select" style="font-family:var(--font-sans)">${prefOptions(cmpB)}</select>
            </div>
            <div>
              <label class="field-label" for="cmp-sel-c">Prefecture C</label>
              <select id="cmp-sel-c" class="field-select" style="font-family:var(--font-sans)">${prefOptions(cmpC)}</select>
            </div>
          </div>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Indicator</th>
                  ${comparePrefs.map((p) => `<th class="num-col">${escapeHtml(p.name)}</th>`).join("")}
                </tr>
              </thead>
              <tbody>
                <tr><td>Population (Oct 2024)</td>${comparePrefs.map((p) => `<td class="num-col">${p.popM.toFixed(2)}M</td>`).join("")}</tr>
                <tr><td>5-Yr Pop. Change</td>${comparePrefs.map((p) => `<td class="num-col">${p.popChange5y > 0 ? "+" : ""}${p.popChange5y.toFixed(1)}%</td>`).join("")}</tr>
                <tr><td>GDP per Capita</td>${comparePrefs.map((p) => `<td class="num-col">¥${p.gdpPerCapitaM.toFixed(2)}M</td>`).join("")}</tr>
                <tr><td>Senior Share (65+)</td>${comparePrefs.map((p) => `<td class="num-col">${p.age65Pct.toFixed(1)}%</td>`).join("")}</tr>
                <tr><td>Job Openings Ratio</td>${comparePrefs.map((p) => `<td class="num-col">${p.jobRatio.toFixed(2)}x</td>`).join("")}</tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </section>

    <section class="panel" style="margin-top:11px">
      <div class="panel-head">
        <div>
          <h2 class="panel-title">Complete 47-Prefecture Statistical Directory (${filtered.length} shown)</h2>
          <p class="panel-subtitle">Click any column header to sort; click any row to highlight on the archipelago map</p>
        </div>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>JIS</th>
              <th><button class="sort-btn" data-reg-sort="name" type="button">Prefecture</button></th>
              <th>Region</th>
              <th class="num-col"><button class="sort-btn" data-reg-sort="popM" type="button">Pop. (M)</button></th>
              <th class="num-col"><button class="sort-btn" data-reg-sort="popChange5y" type="button">5Y Chg</button></th>
              <th class="num-col"><button class="sort-btn" data-reg-sort="gdpPerCapitaM" type="button">GDP/Cap</button></th>
              <th class="num-col"><button class="sort-btn" data-reg-sort="age65Pct" type="button">65+ %</button></th>
              <th class="num-col"><button class="sort-btn" data-reg-sort="jobRatio" type="button">Jobs/App</button></th>
              <th>Primary Economic Specialization</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map((p) => `
              <tr class="${p.code === selectedCode ? "is-selected" : ""}" data-pref-row="${p.code}" style="cursor:pointer">
                <td class="num">${p.code}</td>
                <td><strong>${escapeHtml(p.name)}</strong></td>
                <td>${escapeHtml(p.region)}</td>
                <td class="num-col">${p.popM.toFixed(2)}</td>
                <td class="num-col">${p.popChange5y > 0 ? "+" : ""}${p.popChange5y.toFixed(1)}%</td>
                <td class="num-col">¥${p.gdpPerCapitaM.toFixed(2)}M</td>
                <td class="num-col">${p.age65Pct.toFixed(1)}%</td>
                <td class="num-col">${p.jobRatio.toFixed(2)}x</td>
                <td>${escapeHtml(p.sector)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

export function bindRegionsInteractions(root, state, updateState) {
  root.querySelectorAll("[data-reg-metric]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.getAttribute("data-reg-metric");
      updateState({ regionMetric: key, regionSort: key, regionSortDir: "desc" });
    });
  });

  root.querySelectorAll("[data-pref-code], [data-pref-row]").forEach((el) => {
    el.addEventListener("click", () => {
      const code = el.getAttribute("data-pref-code") || el.getAttribute("data-pref-row");
      updateState({ selectedPref: code });
    });
  });

  root.querySelector("#pin-to-slot-b")?.addEventListener("click", () => {
    updateState({ compareB: state.selectedPref || "13" });
  });

  root.querySelector("#cmp-sel-a")?.addEventListener("change", (e) => updateState({ compareA: e.target.value }));
  root.querySelector("#cmp-sel-b")?.addEventListener("change", (e) => updateState({ compareB: e.target.value }));
  root.querySelector("#cmp-sel-c")?.addEventListener("change", (e) => updateState({ compareC: e.target.value }));
  root.querySelector("#reg-bloc-select")?.addEventListener("change", (e) => updateState({ regionBloc: e.target.value }));
  root.querySelector("#reg-search-input")?.addEventListener("input", (e) => updateState({ regionSearch: e.target.value }));

  root.querySelectorAll("[data-reg-sort]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const col = btn.getAttribute("data-reg-sort");
      const nextDir = state.regionSort === col && state.regionSortDir === "desc" ? "asc" : "desc";
      updateState({ regionSort: col, regionSortDir: nextDir });
    });
  });

  root.querySelector("#export-pref-csv")?.addEventListener("click", () => {
    downloadCsvFile(
      "japan-47-prefectures-2024.csv",
      ["JIS_Code", "Prefecture", "Region", "Population_Millions_2024", "Pop_Change_5Y_Pct", "GDP_Per_Capita_Million_JPY", "Aged_65_Plus_Pct", "Job_Openings_Ratio", "Specialization"],
      PREFECTURES_47.map((p) => [p.code, p.name, p.region, p.popM, p.popChange5y, p.gdpPerCapitaM, p.age65Pct, p.jobRatio, p.sector]),
    );
  });
}