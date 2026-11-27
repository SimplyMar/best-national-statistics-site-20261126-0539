// Economy, Prices, Energy & External Trade (#/economy) — Desktop & 390x844 Mobile optimized.

import { CPI_BASKET_2024, ELECTRICITY_MIX_FY24, HOUSEHOLD_DECILES_MAN_YEN, TRADE_PARTNERS_2024 } from "./economy-data.js";
import { MACRO_DECADE } from "./national-summary-data.js";
import { renderHorizontalBarsSvg, renderStackedMixBarSvg } from "./svg-charts.js";
import { downloadCsvFile, escapeHtml, formatSigned, formatYen } from "./export-utils.js";

function estimateIncomePercentile(annualManYen) {
  if (annualManYen <= 135) return "Bottom 10% of households";
  if (annualManYen <= 248) return "10th–25th percentile";
  if (annualManYen <= 410) return "25th–50th (below ¥4.10M median)";
  if (annualManYen <= 685) return "50th–75th (above national median)";
  if (annualManYen <= 980) return "75th–90th percentile";
  return "Top 10% of households (>¥9.80M)";
}

export function renderEconomyView(state) {
  const annualIncomeYen = Math.max(500000, Number(state.econAnnualIncome || 5200000));
  const baseYear = Number(state.econBaseYear || 2018);
  const baseRow = MACRO_DECADE.find((r) => r.year === baseYear) || MACRO_DECADE[3];
  const currRow = MACRO_DECADE[MACRO_DECADE.length - 1];
  const cpiRatio = currRow.cpiAllIdx / baseRow.cpiAllIdx;
  const neededIn2024 = Math.round(annualIncomeYen * cpiRatio);
  const real2020Yen = Math.round(annualIncomeYen / (currRow.cpiAllIdx / 100));
  const percentileLabel = estimateIncomePercentile(annualIncomeYen / 10000);

  return `
    <section class="context-banner" aria-label="Economy and prices overview">
      <div class="context-headline">
        <h1>National Accounts, CPI Inflation &amp; Trade</h1>
        <span class="context-sub">ESRI GDP · MIC CPI (2020=100) · MHLW Wages · MOF Trade · METI Energy</span>
      </div>
      <button id="export-trade-csv" class="btn btn-subtle" type="button">Export Trade CSV</button>
    </section>

    <section class="mini-kpi-strip" aria-label="Headline macroeconomic accounts">
      <div class="mini-kpi">
        <div class="mini-kpi-label">Nominal GDP</div>
        <div class="mini-kpi-val num">¥609.3T</div>
        <div class="mini-kpi-sub">FY24: ¥642.4T · ESRI</div>
      </div>
      <div class="mini-kpi">
        <div class="mini-kpi-label">All-Items CPI</div>
        <div class="mini-kpi-val num" style="color:var(--vermilion)">108.5</div>
        <div class="mini-kpi-sub">Core +2.5% YoY · MIC</div>
      </div>
      <div class="mini-kpi">
        <div class="mini-kpi-label">Monthly Wage</div>
        <div class="mini-kpi-val num">¥339.5k</div>
        <div class="mini-kpi-sub">+2.9% nom · MHLW</div>
      </div>
      <div class="mini-kpi">
        <div class="mini-kpi-label">Trade Balance</div>
        <div class="mini-kpi-val num">-¥5.33T</div>
        <div class="mini-kpi-sub">Exp ¥107.1T · MOF</div>
      </div>
    </section>

    <section class="split-deck">
      <div class="stack-col">
        <article class="panel">
          <div class="panel-head" style="margin-bottom:6px">
            <div>
              <h2 class="panel-title">2024 CPI Inflation Point Contributions (pp)</h2>
              <p class="panel-subtitle">Contribution of expenditure divisions to headline CPI (+2.7% all items, +2.5% core · MIC)</p>
            </div>
          </div>
          <div class="chart-frame">
            ${renderHorizontalBarsSvg(CPI_BASKET_2024, 1.2)}
          </div>
          <div class="source-line">
            <span>Food (weight 26.3%) &amp; services drove 62% of CY2024 price gains</span>
            <span>MIC 2020=100</span>
          </div>
        </article>

        <article class="panel">
          <div class="panel-head" style="margin-bottom:6px">
            <div>
              <h2 class="panel-title">Household Income &amp; Real Purchasing-Power Lab</h2>
              <p class="panel-subtitle">Benchmark annual gross income against MHLW percentiles and CPI since ${baseYear}</p>
            </div>
          </div>
          <div class="calc-grid">
            <div>
              <label class="field-label" for="econ-income-input">Annual Household Income (JPY)</label>
              <input id="econ-income-input" class="field-input" type="number" min="500000" step="100000" value="${annualIncomeYen}" />
            </div>
            <div>
              <label class="field-label" for="econ-base-year">Compare Base</label>
              <select id="econ-base-year" class="field-select">
                ${MACRO_DECADE.map((r) => `<option value="${r.year}" ${r.year === baseYear ? "selected" : ""}>${r.year}</option>`).join("")}
              </select>
            </div>
            <div>
              <label class="field-label">2020 Constant Value</label>
              <div class="field-input num" style="background:var(--bg-tint);font-weight:700">${formatYen(real2020Yen)}</div>
            </div>
          </div>
          <div class="calc-result-box">
            <div>
              <div class="field-label">2024 Yen Needed to Match ${baseYear} Buying Power</div>
              <div class="calc-big num">${formatYen(neededIn2024)}</div>
              <div style="font-size:11px;color:var(--ink-700);margin-top:2px">National standing: <strong>${escapeHtml(percentileLabel)}</strong></div>
            </div>
            <span class="badge badge-warn">${formatSigned((cpiRatio - 1) * 100, 1)} CPI</span>
          </div>
          <div class="source-line">
            <span>Percentiles: MHLW Comprehensive Survey of Living Conditions (Median ¥4.10M, Mean ¥5.24M)</span>
          </div>
        </article>
      </div>

      <div class="stack-col">
        <article class="panel">
          <div class="panel-head" style="margin-bottom:6px">
            <div>
              <h2 class="panel-title">FY2024 Electricity Generation Mix (991 TWh)</h2>
              <p class="panel-subtitle">Thermal 67.5% · Renewables 23.1% · Nuclear 9.4% (METI ANRE Energy Statistics)</p>
            </div>
          </div>
          <div class="chart-frame">
            ${renderStackedMixBarSvg(ELECTRICITY_MIX_FY24)}
          </div>
        </article>

        <article class="panel">
          <div class="panel-head" style="margin-bottom:6px">
            <div>
              <h2 class="panel-title">Merchandise Trade by Partner (CY 2024, ¥ Trillion)</h2>
              <p class="panel-subtitle">Exports ¥107.09T (+6.2%, record high) · Imports ¥112.42T (+1.8%) · MOF Customs</p>
            </div>
          </div>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Partner</th>
                  <th class="num-col">Exports</th>
                  <th class="num-col">Imports</th>
                  <th class="num-col">Balance</th>
                  <th>Primary Flow</th>
                </tr>
              </thead>
              <tbody>
                ${TRADE_PARTNERS_2024.map((t) => `
                  <tr>
                    <td><strong>${escapeHtml(t.partner)}</strong></td>
                    <td class="num-col">¥${t.exportsT.toFixed(2)}T</td>
                    <td class="num-col">¥${t.importsT.toFixed(2)}T</td>
                    <td class="num-col" style="color:${t.balanceT >= 0 ? "var(--jade)" : "var(--vermilion)"};font-weight:700">${formatSigned(t.balanceT, 2, "T")}</td>
                    <td>${escapeHtml(t.leadItem)}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </section>
  `;
}

export function bindEconomyInteractions(root, state, updateState) {
  const incInput = root.querySelector("#econ-income-input");
  incInput?.addEventListener("change", () => {
    updateState({ econAnnualIncome: Math.max(500000, Number(incInput.value) || 5200000) });
  });
  root.querySelector("#econ-base-year")?.addEventListener("change", (e) => {
    updateState({ econBaseYear: Number(e.target.value) });
  });
  root.querySelector("#export-trade-csv")?.addEventListener("click", () => {
    downloadCsvFile(
      "japan-merchandise-trade-partners-2024.csv",
      ["Partner", "Exports_Trillion_JPY", "Imports_Trillion_JPY", "Balance_Trillion_JPY", "Primary_Commodities"],
      TRADE_PARTNERS_2024.map((t) => [t.partner, t.exportsT, t.importsT, t.balanceT, t.leadItem]),
    );
  });
}