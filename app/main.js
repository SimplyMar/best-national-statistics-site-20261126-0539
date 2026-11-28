// Client-side hash router, persisted analytical state, global search jump, and lazy module loader.

import { HEADLINE_KPIS } from "./national-summary-data.js";
import { bindOverviewInteractions, renderOverviewView } from "./overview-view.js";
import { downloadCsvFile, showToast } from "./export-utils.js";

const STORAGE_KEY = "retto_almanac_state_v1";

const DEFAULT_STATE = {
  overviewMode: "gdp",
  overviewYear: 2024,
  overviewMapMetric: "age65Pct",
  calcYen: 1000000,
  calcFromYear: 2015,
  calcToYear: 2024,
  regionMetric: "gdpPerCapitaM",
  selectedPref: "13",
  compareA: "13",
  compareB: "23",
  compareC: "47",
  regionBloc: "All",
  regionSearch: "",
  regionSort: "gdpPerCapitaM",
  regionSortDir: "desc",
  pyramidEpoch: "2024",
  showBaseline2000: true,
  cohortIdx: 10,
  econAnnualIncome: 5200000,
  econBaseYear: 2018,
  catalogDomain: "All",
  catalogQuery: "",
  societyTheme: "All",
  sourcesQuery: "",
  sourcesAgency: "All",
  glossaryTopic: "All",
  glossaryQuery: "",
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_STATE, ...JSON.parse(raw) } : { ...DEFAULT_STATE };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

let appState = loadState();

function persistState(patch) {
  appState = { ...appState, ...patch };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  } catch {
    // Ignore storage quota errors in restricted sandboxes.
  }
  renderActiveRoute();
}

function parseHashRoute() {
  const raw = window.location.hash || "#/";
  const [pathPart] = raw.replace(/^#/, "").split("?");
  if (pathPart.startsWith("/regions")) return "regions";
  if (pathPart.startsWith("/demographics")) return "demographics";
  if (pathPart.startsWith("/economy")) return "economy";
  if (pathPart.startsWith("/catalog")) return "catalog";
  if (pathPart.startsWith("/society")) return "society";
  if (pathPart.startsWith("/sources")) return "sources";
  if (pathPart.startsWith("/glossary")) return "glossary";
  return "overview";
}

let renderToken = 0;

async function renderActiveRoute() {
  const token = ++renderToken;
  window.__shotReady = false;

  const route = parseHashRoute();
  const root = document.getElementById("view-root");
  if (!root) return;

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.toggle("is-active", link.getAttribute("data-route") === route);
  });

  if (route === "regions") {
    const mod = await import("./regions-view.js");
    if (token !== renderToken) return;
    root.innerHTML = mod.renderRegionsView(appState);
    mod.bindRegionsInteractions(root, appState, persistState);
  } else if (route === "demographics") {
    const mod = await import("./demographics-view.js");
    if (token !== renderToken) return;
    root.innerHTML = mod.renderDemographicsView(appState);
    mod.bindDemographicsInteractions(root, appState, persistState);
  } else if (route === "economy") {
    const mod = await import("./economy-view.js");
    if (token !== renderToken) return;
    root.innerHTML = mod.renderEconomyView(appState);
    mod.bindEconomyInteractions(root, appState, persistState);
  } else if (route === "catalog") {
    const mod = await import("./catalog-view.js");
    if (token !== renderToken) return;
    root.innerHTML = mod.renderCatalogView(appState);
    mod.bindCatalogInteractions(root, appState, persistState);
  } else if (route === "society") {
    const mod = await import("./society-view.js");
    if (token !== renderToken) return;
    root.innerHTML = mod.renderSocietyView(appState);
    mod.bindSocietyInteractions(root, appState, persistState);
  } else if (route === "sources") {
    const mod = await import("./sources-view.js");
    if (token !== renderToken) return;
    root.innerHTML = mod.renderSourcesView(appState);
    mod.bindSourcesInteractions(root, appState, persistState);
  } else if (route === "glossary") {
    const mod = await import("./glossary-view.js");
    if (token !== renderToken) return;
    root.innerHTML = mod.renderGlossaryView(appState);
    mod.bindGlossaryInteractions(root, appState, persistState);
  } else {
    root.innerHTML = renderOverviewView(appState);
    bindOverviewInteractions(root, appState, persistState);
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.__shotReady = true;
    });
  });
}

document.getElementById("global-search-form")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const input = document.getElementById("global-search-input");
  const term = (input?.value || "").trim();
  appState = { ...appState, catalogQuery: term, catalogDomain: "All" };
  if (parseHashRoute() === "catalog") {
    renderActiveRoute();
  } else {
    window.location.hash = "#/catalog";
  }
});

document.getElementById("export-headline-btn")?.addEventListener("click", () => {
  downloadCsvFile(
    "japan-headline-pulse-2024.csv",
    ["ID", "Domain", "Indicator", "Latest_Value", "Delta", "Reference_Period", "Source_Agency"],
    HEADLINE_KPIS.map((k) => [k.id, k.domain, k.label, k.value, k.delta, k.period, k.source]),
  );
});

document.getElementById("reset-state-btn")?.addEventListener("click", () => {
  appState = { ...DEFAULT_STATE };
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage access errors.
  }
  const searchInput = document.getElementById("global-search-input");
  if (searchInput) searchInput.value = "";
  showToast("All filters and calculators reset to defaults");
  renderActiveRoute();
});

window.addEventListener("hashchange", () => {
  window.scrollTo(0, 0);
  renderActiveRoute();
});

renderActiveRoute();