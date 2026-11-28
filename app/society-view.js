// Society & Living page: theme filter chips, fact cards with source and year for every figure,
// a life-expectancy trend chart, a household-mix bar, and CSV export of the shown facts.

import { HOUSEHOLD_MIX_2020, LIFE_EXPECTANCY_SERIES, SOCIETY_FACTS, SOCIETY_THEMES } from "./society-data.js";
import { downloadCsvFile, showToast } from "./export-utils.js";

const TONE_COLOURS = {
  jade: "#1e6b52",
  ochre: "#a86814",
  vermilion: "#c43a27",
  indigo: "#1b4f72",
  muted: "#8c8577",
};

const escapeHtml = (text) =>
  String(text).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);

/** The facts the current theme filter shows ("All" shows every theme). */
function visibleFacts(theme) {
  return theme === "All" ? SOCIETY_FACTS : SOCIETY_FACTS.filter((fact) => fact.theme === theme);
}

function themeOf(id) {
  return SOCIETY_THEMES.find((theme) => theme.id === id);
}

/** Line chart of life expectancy for men and women, drawn as inline SVG. */
function lifeExpectancyChart() {
  const width = 560;
  const height = 230;
  const pad = { left: 44, right: 108, top: 18, bottom: 30 };
  const years = LIFE_EXPECTANCY_SERIES.map((point) => point.year);
  const minYear = years[0];
  const maxYear = years[years.length - 1];
  const minAge = 60;
  const maxAge = 90;
  const x = (year) => pad.left + ((year - minYear) / (maxYear - minYear)) * (width - pad.left - pad.right);
  const y = (age) => pad.top + (1 - (age - minAge) / (maxAge - minAge)) * (height - pad.top - pad.bottom);
  const path = (key) => LIFE_EXPECTANCY_SERIES.map((p, i) => `${i ? "L" : "M"}${x(p.year).toFixed(1)},${y(p[key]).toFixed(1)}`).join(" ");
  const gridAges = [60, 70, 80, 90];
  const last = LIFE_EXPECTANCY_SERIES[LIFE_EXPECTANCY_SERIES.length - 1];
  const grid = gridAges
    .map((age) => `<line x1="${pad.left}" x2="${width - pad.right}" y1="${y(age)}" y2="${y(age)}" stroke="#dfd9cb" /><text x="${pad.left - 8}" y="${y(age) + 4}" text-anchor="end" class="axis-label">${age}</text>`)
    .join("");
  // Label a year only when it sits far enough from the last labelled one, so ticks never collide.
  let lastLabelX = Infinity;
  const ticks = years
    .slice()
    .reverse()
    .filter((year) => {
      if (lastLabelX - x(year) < 34) return false;
      lastLabelX = x(year);
      return true;
    })
    .map((year) => `<text x="${x(year)}" y="${height - 8}" text-anchor="middle" class="axis-label">${year}</text>`)
    .join("");
  const dots = (key, colour) =>
    LIFE_EXPECTANCY_SERIES.map((p) => `<circle cx="${x(p.year)}" cy="${y(p[key])}" r="3.5" fill="${colour}"><title>${p.year}: ${p[key].toFixed(2)} years</title></circle>`).join("");
  return `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Life expectancy at birth in Japan, 1960 to 2023, men and women">
      ${grid}${ticks}
      <path d="${path("women")}" fill="none" stroke="${TONE_COLOURS.vermilion}" stroke-width="2.6" />
      <path d="${path("men")}" fill="none" stroke="${TONE_COLOURS.indigo}" stroke-width="2.6" />
      ${dots("women", TONE_COLOURS.vermilion)}${dots("men", TONE_COLOURS.indigo)}
      <text x="${x(last.year) + 8}" y="${y(last.women) + 4}" class="series-end" fill="${TONE_COLOURS.vermilion}">Women ${last.women.toFixed(2)}</text>
      <text x="${x(last.year) + 8}" y="${y(last.men) + 4}" class="series-end" fill="${TONE_COLOURS.indigo}">Men ${last.men.toFixed(2)}</text>
    </svg>`;
}

/** One stacked bar of household types with a legend underneath. */
function householdMixBar() {
  let offset = 0;
  const segments = HOUSEHOLD_MIX_2020.map((part) => {
    const segment = `<span class="mix-seg" style="left:${offset}%;width:${part.share}%;background:${TONE_COLOURS[part.tone]}" title="${escapeHtml(part.type)}: ${part.share}%"></span>`;
    offset += part.share;
    return segment;
  }).join("");
  const legend = HOUSEHOLD_MIX_2020.map(
    (part) => `<li><span class="mix-key" style="background:${TONE_COLOURS[part.tone]}"></span>${escapeHtml(part.type)} <b class="num">${part.share.toFixed(1)}%</b></li>`,
  ).join("");
  const alone = HOUSEHOLD_MIX_2020.find((part) => part.type === "One person");
  return `<div class="mix-bar" role="img" aria-label="Private households by family type, 2020 Census">${segments}</div><ul class="mix-legend">${legend}</ul>
    <p class="mix-callout"><b class="num">${alone.share.toFixed(0)}%</b> of homes are one person living alone: more than couples with children for the first time in the 2010 Census, and the gap has grown since.</p>`;
}

function factCard(fact) {
  const theme = themeOf(fact.theme);
  return `
    <article class="fact-card tone-${theme.accent}" data-fact="${fact.id}">
      <div class="fact-theme">${escapeHtml(theme.label)}</div>
      <h3 class="fact-label">${escapeHtml(fact.label)}</h3>
      <div class="fact-value num">${escapeHtml(fact.value)}</div>
      <p class="fact-note">${escapeHtml(fact.note)}</p>
      <div class="fact-source"><span>${escapeHtml(fact.source)}</span><b>${escapeHtml(fact.period)}</b></div>
    </article>`;
}

/** Render the whole Society & Living page for the saved state. */
export function renderSocietyView(state) {
  const theme = state.societyTheme || "All";
  const facts = visibleFacts(theme);
  const chips = ["All", ...SOCIETY_THEMES.map((t) => t.id)]
    .map((id) => {
      const label = id === "All" ? `All themes (${SOCIETY_FACTS.length})` : `${themeOf(id).label} (${SOCIETY_FACTS.filter((f) => f.theme === id).length})`;
      return `<button type="button" class="chip-btn${id === theme ? " is-active" : ""}" data-society-theme="${id}">${escapeHtml(label)}</button>`;
    })
    .join("");
  return `
    <section class="context-banner">
      <div class="context-headline">
        <h1>Society &amp; Living</h1>
        <p class="context-sub">How long people live, who they live with, the homes they live in, how safe the roads are, and the land and climate around them: ${SOCIETY_FACTS.length} official figures, each with its source and year.</p>
      </div>
      <div class="context-meta">
        <span class="badge badge-up">Life expectancy 87.14 / 81.09</span>
        <button type="button" class="btn btn-subtle" id="society-csv-btn">Export ${facts.length} figures CSV</button>
      </div>
    </section>
    <div class="theme-chips" role="group" aria-label="Filter figures by theme">${chips}</div>
    <div class="society-deck">
      <section class="panel">
        <div class="panel-head"><div><h2 class="panel-title">Life expectancy at birth, 1960–2023</h2><p class="panel-subtitle">Women have gained 16.95 years and men 15.77 years since 1960</p></div></div>
        <div class="chart-frame life-chart">${lifeExpectancyChart()}</div>
        <p class="source-line">MHLW Complete and Abridged Life Tables · years of life at birth</p>
      </section>
      <section class="panel">
        <div class="panel-head"><div><h2 class="panel-title">Who lives together</h2><p class="panel-subtitle">55.7 million private households by family type, 2020 Census</p></div></div>
        ${householdMixBar()}
        <p class="source-line">MIC Statistics Bureau · 2020 Population Census, private households</p>
      </section>
    </div>
    <section class="fact-grid" aria-label="Society and living figures">${facts.map(factCard).join("")}</section>`;
}

/** Wire the theme chips and the CSV export button. */
export function bindSocietyInteractions(root, state, persistState) {
  root.querySelectorAll("[data-society-theme]").forEach((button) => {
    button.addEventListener("click", () => persistState({ societyTheme: button.getAttribute("data-society-theme") }));
  });
  root.querySelector("#society-csv-btn")?.addEventListener("click", () => {
    const facts = visibleFacts(state.societyTheme || "All");
    downloadCsvFile(
      "japan-society-and-living.csv",
      ["ID", "Theme", "Indicator", "Value", "Unit", "Reference_Period", "Source"],
      facts.map((f) => [f.id, themeOf(f.theme).label, f.label, f.raw, f.unit, f.period, f.source]),
    );
    showToast(`Exported ${facts.length} Society & Living figures`);
  });
}
