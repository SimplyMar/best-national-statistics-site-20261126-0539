// Population Structure, Vital Trends & Labor (#/demographics).

import { LABOR_INDUSTRIES, PYRAMID_EPOCHS, VITAL_TRENDS } from "./demographics-data.js";
import { renderPopulationPyramidSvg, renderVitalLinesSvg } from "./svg-charts.js";
import { downloadCsvFile, escapeHtml } from "./export-utils.js";

export function renderDemographicsView(state) {
  const epochKey = PYRAMID_EPOCHS[state.pyramidEpoch] ? state.pyramidEpoch : "2024";
  const showBaseline = state.showBaseline2000 !== false;
  const selectedCohortIdx = Number.isInteger(state.cohortIdx) ? state.cohortIdx : 10; // 50-54 Dankai Jr.
  const ep = PYRAMID_EPOCHS[epochKey];
  const cohort = ep.cohorts[selectedCohortIdx] || ep.cohorts[10];
  const cohortTotal = cohort.male + cohort.female;

  return `
    <section class="toolbar-strip" aria-label="Demographic controls">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <strong style="font-family:var(--font-serif);font-size:15px">Population Structure, Vital Balance &amp; Workforce</strong>
        <div class="seg-group" role="tablist" aria-label="Pyramid reference year">
          ${Object.keys(PYRAMID_EPOCHS).map((yr) => `<button class="seg-btn ${yr === epochKey ? "is-active" : ""}" data-pyr-epoch="${yr}" type="button">${yr}${yr === "2040" ? " Proj." : ""}</button>`).join("")}
        </div>
        <label style="font-size:12px;display:inline-flex;align-items:center;gap:5px;cursor:pointer">
          <input id="toggle-2000-overlay" type="checkbox" ${showBaseline ? "checked" : ""} />
          Overlay 2000 Census outline
        </label>
      </div>
      <button id="export-pyramid-csv" class="btn btn-primary" type="button">Export Pyramid CSV</button>
    </section>

    <section class="mini-kpi-strip" aria-label="Selected epoch summary">
      <div class="mini-kpi">
        <div class="mini-kpi-label">${escapeHtml(ep.label)}</div>
        <div class="mini-kpi-val num">${ep.totalM.toFixed(2)}M</div>
        <div class="mini-kpi-sub">Median age: ${ep.medianAge.toFixed(1)} yrs</div>
      </div>
      <div class="mini-kpi">
        <div class="mini-kpi-label">Working-Age (15–64)</div>
        <div class="mini-kpi-val num">${ep.workingPct.toFixed(1)}%</div>
        <div class="mini-kpi-sub">${(ep.totalM * ep.workingPct / 100).toFixed(2)}M residents</div>
      </div>
      <div class="mini-kpi">
        <div class="mini-kpi-label">Senior Population (65+)</div>
        <div class="mini-kpi-val num" style="color:var(--vermilion)">${ep.age65Pct.toFixed(1)}%</div>
        <div class="mini-kpi-sub">Old-age dep: ${ep.dependencyRatio.toFixed(1)} / 100</div>
      </div>
      <div class="mini-kpi">
        <div class="mini-kpi-label">Children (0–14) &amp; Life Exp.</div>
        <div class="mini-kpi-val num">${ep.under15Pct.toFixed(1)}%</div>
        <div class="mini-kpi-sub">87.14y F · 81.09y M (MHLW)</div>
      </div>
    </section>

    <section class="split-atlas">
      <article class="panel">
        <div class="panel-head">
          <div>
            <h2 class="panel-title">Bilateral Age–Sex Population Pyramid (${epochKey})</h2>
            <p class="panel-subtitle">Click any 5-year age bracket to inspect male/female balance; dashed ochre line marks 2000 Census</p>
          </div>
        </div>
        <div class="chart-frame">
          ${renderPopulationPyramidSvg(ep.cohorts, showBaseline && epochKey !== "2000" ? PYRAMID_EPOCHS["2000"].cohorts : null, selectedCohortIdx)}
        </div>
        <div class="year-scrubber">
          <span><strong>Selected Cohort (${cohort.age} yrs):</strong> ${cohortTotal.toFixed(2)}M (${((cohortTotal / ep.totalM) * 100).toFixed(1)}% of nation)</span>
          <span class="num">Male <strong>${cohort.male.toFixed(2)}M</strong> · Female <strong>${cohort.female.toFixed(2)}M</strong></span>
        </div>
        <div class="source-line">
          <span>Source: ${escapeHtml(ep.source)}</span>
          <span>Foreign residents: 3.59M (ISA 2024)</span>
        </div>
      </article>

      <div class="stack-col">
        <section class="panel">
          <div class="panel-head" style="margin-bottom:4px">
            <div>
              <h2 class="panel-title">Natural Population Change (1990–2024)</h2>
              <p class="panel-subtitle">Annual live births vs. deaths · 2024 natural balance: -919k (TFR 1.15)</p>
            </div>
          </div>
          <div class="chart-frame">
            ${renderVitalLinesSvg(VITAL_TRENDS)}
          </div>
          <div class="source-line">
            <span>Source: MHLW Vital Statistics (Annual &amp; 2024 Preliminary)</span>
          </div>
        </section>

        <section class="panel">
          <div class="panel-head" style="margin-bottom:6px">
            <div>
              <h2 class="panel-title">Employment &amp; Scheduled Cash Earnings by Sector</h2>
              <p class="panel-subtitle">MIC Labour Force Survey &amp; MHLW Monthly Labour Survey (CY 2024, 5+ employees)</p>
            </div>
          </div>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Industry Division</th>
                  <th class="num-col">Employed</th>
                  <th class="num-col">Female %</th>
                  <th class="num-col">Wage / Mo</th>
                  <th class="num-col">YoY</th>
                </tr>
              </thead>
              <tbody>
                ${LABOR_INDUSTRIES.map((row) => `
                  <tr>
                    <td><strong>${escapeHtml(row.sector)}</strong></td>
                    <td class="num-col">${row.employedM.toFixed(2)}M</td>
                    <td class="num-col">${row.femalePct.toFixed(1)}%</td>
                    <td class="num-col">¥${row.monthlyWageK.toFixed(1)}k</td>
                    <td class="num-col">+${row.yoyPct.toFixed(1)}%</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </section>
  `;
}

export function bindDemographicsInteractions(root, state, updateState) {
  root.querySelectorAll("[data-pyr-epoch]").forEach((btn) => {
    btn.addEventListener("click", () => updateState({ pyramidEpoch: btn.getAttribute("data-pyr-epoch") }));
  });
  root.querySelector("#toggle-2000-overlay")?.addEventListener("change", (e) => {
    updateState({ showBaseline2000: e.target.checked });
  });
  root.querySelectorAll("[data-cohort-idx]").forEach((el) => {
    el.addEventListener("click", () => updateState({ cohortIdx: Number(el.getAttribute("data-cohort-idx")) }));
  });
  root.querySelector("#export-pyramid-csv")?.addEventListener("click", () => {
    const epKey = PYRAMID_EPOCHS[state.pyramidEpoch] ? state.pyramidEpoch : "2024";
    const ep = PYRAMID_EPOCHS[epKey];
    downloadCsvFile(
      `japan-population-pyramid-${epKey}.csv`,
      ["Age_Cohort", "Male_Millions", "Female_Millions", "Total_Millions", "Source"],
      ep.cohorts.map((c) => [c.age, c.male, c.female, (c.male + c.female).toFixed(2), ep.source]),
    );
  });
}