// The overview's prefecture map panel, loaded by main.js with import() so the 47-prefecture table and the
// coastlines stay out of the first load: indicator tabs, the bubble map, the highest and lowest prefecture,
// the source, and bubbles that open the prefecture atlas on the one clicked.

import { PREFECTURES_47, REGION_METRICS } from "./prefectures-data.js";
import { renderPrefectureBubbleMap } from "./japan-map.js";
import { escapeHtml } from "./export-utils.js";

/** The indicators the overview map can colour by, with the release each comes from. */
const MAP_CHOICES = [
  { key: "age65Pct", tab: "Aged 65+", source: "MIC Population Estimates, 1 Oct 2024" },
  { key: "popM", tab: "Population", source: "MIC Population Estimates, 1 Oct 2024" },
  { key: "gdpPerCapitaM", tab: "GDP / head", source: "Cabinet Office Prefectural Accounts, FY2021" },
  { key: "popChange5y", tab: "5-yr change", source: "MIC Population Estimates, 2019–2024" },
];

/** The highest and lowest prefectures on a metric, for the line under the map. */
export function rankExtremes(metricKey) {
  const sorted = [...PREFECTURES_47].sort((a, b) => b[metricKey] - a[metricKey]);
  return { top: sorted[0], bottom: sorted[sorted.length - 1] };
}

/** The map panel for the chosen indicator. */
export function renderMapPanel(mapKey) {
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

/** Wire the indicator tabs, and make each bubble open the atlas with that prefecture selected. */
export function bindMapPanel(root, state, updateState) {
  root.querySelectorAll("[data-overview-map]").forEach((button) => {
    button.addEventListener("click", () => updateState({ overviewMapMetric: button.getAttribute("data-overview-map") }));
  });
  root.querySelectorAll(".map-bubble").forEach((bubble) => {
    const openAtlas = () => {
      updateState({ selectedPref: bubble.getAttribute("data-pref-code"), regionMetric: state.overviewMapMetric || "age65Pct" });
      window.location.hash = "#/regions";
    };
    bubble.addEventListener("click", openAtlas);
    bubble.addEventListener("keydown", (event) => {
      if (event.key === "Enter") openAtlas();
    });
  });
}
