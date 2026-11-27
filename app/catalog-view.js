// Searchable 32-Series Catalog, CSV/JSON Export, Citation Builder & Survey Methodology (#/catalog).

import { INDICATOR_CATALOG, METHODOLOGY_CARDS } from "./catalog-data.js";
import { copyCitationText, downloadCsvFile, downloadJsonFile, escapeHtml } from "./export-utils.js";

const DOMAINS = ["All", "Macro", "Prices", "Population", "Labor", "Trade & Energy"];

export function renderCatalogView(state) {
  const domain = state.catalogDomain || "All";
  const query = (state.catalogQuery || "").trim().toLowerCase();

  const matches = INDICATOR_CATALOG.filter((row) => {
    if (domain !== "All" && row.domain !== domain) return false;
    if (query && !`${row.code} ${row.title} ${row.agency} ${row.survey} ${row.domain}`.toLowerCase().includes(query)) return false;
    return true;
  });

  return `
    <section class="toolbar-strip" aria-label="Series catalog filters">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <strong style="font-family:var(--font-serif);font-size:15px">Official Indicator Catalog (${matches.length} of ${INDICATOR_CATALOG.length})</strong>
        <div class="seg-group" role="tablist" aria-label="Domain filter">
          ${DOMAINS.map((d) => `<button class="seg-btn ${d === domain ? "is-active" : ""}" data-cat-domain="${escapeHtml(d)}" type="button">${escapeHtml(d)}</button>`).join("")}
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap">
        <input id="cat-query-input" class="field-input" style="width:190px;font-family:var(--font-sans)" type="search" placeholder="Search code, agency, survey…" value="${escapeHtml(state.catalogQuery || "")}" />
        <button id="export-cat-csv" class="btn btn-primary" type="button">Download CSV</button>
        <button id="export-cat-json" class="btn btn-subtle" type="button">JSON</button>
      </div>
    </section>

    <section class="panel" style="margin-bottom:11px">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Domain</th>
              <th>Indicator Title</th>
              <th class="num-col">Latest</th>
              <th class="num-col">Change</th>
              <th>Ref. Period</th>
              <th>Compiling Agency &amp; Survey</th>
              <th>Cite</th>
            </tr>
          </thead>
          <tbody>
            ${matches.length === 0
              ? `<tr><td colspan="8" style="text-align:center;padding:18px;color:var(--ink-500)">No statistical series matched "${escapeHtml(state.catalogQuery)}". <button class="link-btn" id="clear-cat-search" type="button">Clear filter</button></td></tr>`
              : matches.map((r) => `
                <tr>
                  <td class="num"><strong>${escapeHtml(r.code)}</strong></td>
                  <td><span class="badge badge-neutral">${escapeHtml(r.domain)}</span></td>
                  <td><strong>${escapeHtml(r.title)}</strong></td>
                  <td class="num-col">${escapeHtml(r.latest)}</td>
                  <td class="num-col">${escapeHtml(r.change)}</td>
                  <td>${escapeHtml(r.period)} (${escapeHtml(r.freq)})</td>
                  <td>${escapeHtml(r.agency)} · <span style="color:var(--ink-500)">${escapeHtml(r.survey)}</span></td>
                  <td><button class="link-btn" data-cite-code="${escapeHtml(r.code)}" type="button">Cite</button></td>
                </tr>
              `).join("")}
          </tbody>
        </table>
      </div>
    </section>

    <section class="mini-kpi-strip" style="grid-template-columns:repeat(2,minmax(0,1fr))" aria-label="Statistical methodology notes">
      ${METHODOLOGY_CARDS.map((m) => `
        <article class="panel">
          <h2 class="panel-title" style="font-size:14.5px;margin-bottom:4px">${escapeHtml(m.title)}</h2>
          <p style="margin:0;font-size:12px;color:var(--ink-700)">${escapeHtml(m.detail)}</p>
        </article>
      `).join("")}
    </section>
  `;
}

export function bindCatalogInteractions(root, state, updateState) {
  root.querySelectorAll("[data-cat-domain]").forEach((btn) => {
    btn.addEventListener("click", () => updateState({ catalogDomain: btn.getAttribute("data-cat-domain") }));
  });
  root.querySelector("#cat-query-input")?.addEventListener("input", (e) => {
    updateState({ catalogQuery: e.target.value });
  });
  root.querySelector("#clear-cat-search")?.addEventListener("click", () => {
    updateState({ catalogQuery: "", catalogDomain: "All" });
  });
  root.querySelectorAll("[data-cite-code]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const row = INDICATOR_CATALOG.find((r) => r.code === btn.getAttribute("data-cite-code"));
      if (row) {
        copyCitationText(`${row.agency} (${row.period}). "${row.title}" [${row.code}: ${row.latest}], ${row.survey}. Compiled in Retto Almanac.`, row.code);
      }
    });
  });
  root.querySelector("#export-cat-csv")?.addEventListener("click", () => {
    downloadCsvFile(
      "japan-32-national-indicators.csv",
      ["Series_Code", "Domain", "Title", "Latest_Value", "Change", "Reference_Period", "Frequency", "Agency", "Survey"],
      INDICATOR_CATALOG.map((r) => [r.code, r.domain, r.title, r.latest, r.change, r.period, r.freq, r.agency, r.survey]),
    );
  });
  root.querySelector("#export-cat-json")?.addEventListener("click", () => {
    downloadJsonFile("japan-32-national-indicators.json", { edition: "2024-2025", country: "Japan", count: INDICATOR_CATALOG.length, series: INDICATOR_CATALOG });
  });
}