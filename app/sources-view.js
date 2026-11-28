// Sources & Methods page: the directory of the official agencies this almanac draws on, and a
// figure finder that lists every figure on the site with its source and reference period,
// searchable and filterable by agency, so any number can be traced back to its release.

import { HEADLINE_KPIS } from "./national-summary-data.js";
import { INDICATOR_CATALOG } from "./catalog-data.js";
import { SOCIETY_FACTS } from "./society-data.js";
import { downloadCsvFile, showToast } from "./export-utils.js";

/** The publishing agencies, what the almanac takes from each, and how often they publish it. */
export const AGENCY_DIRECTORY = [
  { key: "MIC", name: "Statistics Bureau of Japan (MIC)", uses: "Population census and estimates, labour force, CPI, housing and land survey", cadence: "Monthly CPI and labour force; census every 5 years", match: ["MIC"] },
  { key: "ESRI", name: "Cabinet Office · ESRI", uses: "GDP, consumption and investment (national accounts)", cadence: "Quarterly preliminary and revised estimates; annual report", match: ["ESRI", "Cabinet Office"] },
  { key: "MHLW", name: "Ministry of Health, Labour and Welfare", uses: "Births, deaths, marriages, life tables, wages, health workforce, medical spending", cadence: "Monthly vital statistics; annual life tables", match: ["MHLW"] },
  { key: "MOF", name: "Ministry of Finance · Customs", uses: "Merchandise exports, imports and trade balance", cadence: "Monthly trade statistics", match: ["MOF"] },
  { key: "BOJ", name: "Bank of Japan", uses: "Policy rate, corporate goods prices", cadence: "Eight policy meetings a year; monthly CGPI", match: ["Bank of Japan", "BOJ"] },
  { key: "METI", name: "Ministry of Economy, Trade and Industry", uses: "Industrial production, energy supply and demand", cadence: "Monthly production index; annual energy balance", match: ["METI"] },
  { key: "JNTO", name: "Japan National Tourism Organization / JTA", uses: "Inbound visitors, outbound travellers, visitor spending", cadence: "Monthly arrivals; quarterly spending survey", match: ["JNTO", "JTA"] },
  { key: "OTHER", name: "Other national bodies", uses: "Police (road deaths), GSI (land area), Forestry Agency, Environment Ministry, Immigration Services Agency", cadence: "Annual releases", match: ["Police", "Geospatial", "Forestry", "Environment", "Immigration"] },
];

/** Every figure on the site as one flat list: label, value, period, source, page. */
export function allFigures() {
  const headline = HEADLINE_KPIS.map((k) => ({ label: k.label, value: k.value, period: k.period, source: k.source, page: "Overview", href: "#/" }));
  const catalog = INDICATOR_CATALOG.filter((row) => row.code).map((row) => ({
    label: row.title,
    value: row.latest,
    period: row.period,
    source: `${row.agency} · ${row.survey}`,
    page: "Series Catalog",
    href: "#/catalog",
  }));
  const society = SOCIETY_FACTS.map((f) => ({ label: f.label, value: f.value, period: f.period, source: f.source, page: "Society & Living", href: "#/society" }));
  return [...headline, ...catalog, ...society];
}

/** Which directory agency a source line belongs to. */
function agencyOf(source) {
  return AGENCY_DIRECTORY.find((agency) => agency.match.some((word) => source.includes(word)))?.key ?? "OTHER";
}

const escapeHtml = (text) =>
  String(text).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);

/** The figures the finder shows for a query and an agency filter. */
function filterFigures(query, agency) {
  const needle = query.trim().toLowerCase();
  return allFigures().filter((figure) => {
    if (agency !== "All" && agencyOf(figure.source) !== agency) return false;
    if (!needle) return true;
    return `${figure.label} ${figure.source} ${figure.period} ${figure.page}`.toLowerCase().includes(needle);
  });
}

/** Render the Sources & Methods page for the saved state. */
export function renderSourcesView(state) {
  const query = state.sourcesQuery || "";
  const agency = state.sourcesAgency || "All";
  const figures = allFigures();
  const shown = filterFigures(query, agency);
  const counts = Object.fromEntries(AGENCY_DIRECTORY.map((a) => [a.key, figures.filter((f) => agencyOf(f.source) === a.key).length]));
  const directory = AGENCY_DIRECTORY.map(
    (a) => `
      <button type="button" class="agency-card${agency === a.key ? " is-active" : ""}" data-agency="${a.key}">
        <span class="agency-name">${escapeHtml(a.name)}</span>
        <span class="agency-uses">${escapeHtml(a.uses)}</span>
        <span class="agency-foot"><span>${escapeHtml(a.cadence)}</span><b class="num">${counts[a.key]} figures</b></span>
      </button>`,
  ).join("");
  const rows = shown
    .map(
      (f) => `<tr><td><a href="${f.href}">${escapeHtml(f.label)}</a></td><td class="num-col num">${escapeHtml(f.value)}</td><td>${escapeHtml(f.period)}</td><td class="finder-source">${escapeHtml(f.source)}</td><td>${escapeHtml(f.page)}</td></tr>`,
    )
    .join("");
  return `
    <section class="context-banner">
      <div class="context-headline">
        <h1>Sources &amp; Methods</h1>
        <p class="context-sub">Every one of the ${figures.length} figures in this almanac, traced to the agency and release it comes from, with its reference period. Pick an agency or search to find a number.</p>
      </div>
      <div class="context-meta">
        <span class="badge badge-neutral">${AGENCY_DIRECTORY.length} publishing bodies</span>
        <a class="btn btn-subtle" href="#/glossary">Glossary →</a>
        <button type="button" class="btn btn-subtle" id="sources-csv-btn">Export ${shown.length} rows CSV</button>
      </div>
    </section>
    <section class="agency-grid" aria-label="Publishing agencies">${directory}</section>
    <section class="panel">
      <div class="panel-head">
        <div><h2 class="panel-title">Figure finder</h2><p class="panel-subtitle">${shown.length} of ${figures.length} figures${agency !== "All" ? ` from ${escapeHtml(AGENCY_DIRECTORY.find((a) => a.key === agency).name)}` : ""}</p></div>
        <div class="finder-tools">
          <label class="sr-only" for="sources-query">Search figures</label>
          <input id="sources-query" class="field-input" type="search" placeholder="Search figure, agency or year…" value="${escapeHtml(query)}" />
          <button type="button" class="btn btn-subtle" id="sources-clear-btn">Show all</button>
        </div>
      </div>
      <div class="table-wrap"><table class="data-table finder-table">
        <thead><tr><th>Figure</th><th class="num-col">Latest</th><th>Period</th><th>Source</th><th>Page</th></tr></thead>
        <tbody>${rows || `<tr><td colspan="5">No figure matches “${escapeHtml(query)}”. Try a broader word such as “CPI” or “2024”.</td></tr>`}</tbody>
      </table></div>
      <p class="source-line">Figures are the latest final or preliminary editions; preliminary ones are marked “prelim.” or “Prov.”.</p>
    </section>`;
}

/** Wire the agency cards, the search box, the reset button and the CSV export. */
export function bindSourcesInteractions(root, state, persistState) {
  root.querySelectorAll("[data-agency]").forEach((card) => {
    card.addEventListener("click", () => {
      const key = card.getAttribute("data-agency");
      persistState({ sourcesAgency: state.sourcesAgency === key ? "All" : key });
    });
  });
  const input = root.querySelector("#sources-query");
  input?.addEventListener("change", () => persistState({ sourcesQuery: input.value }));
  root.querySelector("#sources-clear-btn")?.addEventListener("click", () => persistState({ sourcesQuery: "", sourcesAgency: "All" }));
  root.querySelector("#sources-csv-btn")?.addEventListener("click", () => {
    const shown = filterFigures(state.sourcesQuery || "", state.sourcesAgency || "All");
    downloadCsvFile("japan-figure-sources.csv", ["Figure", "Latest", "Period", "Source", "Page"], shown.map((f) => [f.label, f.value, f.period, f.source, f.page]));
    showToast(`Exported ${shown.length} sourced figures`);
  });
}
