// Glossary page (#/glossary): plain-language definitions of the terms the almanac uses, grouped
// by topic, each pointing to the page where the term appears, with a search box and topic tabs.

import { escapeHtml } from "./export-utils.js";

/** Terms a reader meets on the site, with a definition written for non-specialists. */
export const GLOSSARY_TERMS = [
  { term: "Nominal GDP", topic: "Economy", page: "#/", definition: "The market value of everything produced in Japan in a year, at that year's prices. It rises with both more output and higher prices." },
  { term: "Real GDP growth", topic: "Economy", page: "#/", definition: "GDP growth with price changes taken out (chain-linked to 2015 prices), so it shows whether the economy actually produced more." },
  { term: "Calendar year (CY) vs fiscal year (FY)", topic: "Economy", page: "#/catalog", definition: "CY runs January to December. Japan's fiscal year runs April to March, so FY2024 ends on 31 March 2025." },
  { term: "Trade balance", topic: "Economy", page: "#/economy", definition: "Merchandise exports minus imports on a customs basis. A negative figure (a deficit) means Japan bought more goods abroad than it sold." },
  { term: "Current account", topic: "Economy", page: "#/catalog", definition: "The trade balance plus income from overseas investments and services. Japan runs a large surplus thanks to investment income." },
  { term: "Policy rate", topic: "Economy", page: "#/", definition: "The short-term interest rate the Bank of Japan targets for overnight lending between banks; it ended negative rates in March 2024." },
  { term: "CPI (2020 = 100)", topic: "Prices", page: "#/economy", definition: "The consumer price index: the cost of a fixed basket of goods and services, set to 100 in 2020. 108.5 means prices are 8.5% above 2020." },
  { term: "Core CPI", topic: "Prices", page: "#/", definition: "CPI excluding fresh food, whose prices swing with the weather. It is Japan's standard measure of underlying inflation." },
  { term: "Percentage points (pp)", topic: "Prices", page: "#/economy", definition: "The difference between two percentages. A rate moving from 2.5% to 2.6% has risen 0.1 pp, which is a 4% relative increase." },
  { term: "Real wages", topic: "Prices", page: "#/economy", definition: "Wages adjusted for consumer prices. When prices rise faster than pay, real wages fall even if the yen amount grows." },
  { term: "Total fertility rate (TFR)", topic: "Population", page: "#/demographics", definition: "The average number of children a woman would have over her life at this year's birth rates. About 2.07 keeps a population stable." },
  { term: "Natural change", topic: "Population", page: "#/society", definition: "Births minus deaths in a year, before migration. Japan's has been negative every year since 2007." },
  { term: "Population pyramid", topic: "Population", page: "#/demographics", definition: "Bars of men (left) and women (right) by five-year age group. A wide top and narrow base show an ageing, shrinking population." },
  { term: "Old-age dependency ratio", topic: "Population", page: "#/demographics", definition: "People aged 65 and over per 100 people aged 15 to 64: a rough count of retirees per worker-age resident." },
  { term: "Life expectancy at birth", topic: "Population", page: "#/society", definition: "How many years a baby born this year would live if today's death rates at each age stayed the same for its whole life." },
  { term: "Census vs estimate", topic: "Population", page: "#/sources", definition: "The census counts every resident every five years; this almanac uses the 2020 census. Estimates update it monthly from births, deaths and migration." },
  { term: "Unemployment rate", topic: "Labour", page: "#/", definition: "Jobless people actively looking for work as a share of the labour force, seasonally adjusted. People not seeking work are not counted." },
  { term: "Job-openings-to-applicants ratio", topic: "Labour", page: "#/regions", definition: "Job openings at public employment offices per jobseeker. Above 1.0 means more vacancies than applicants." },
  { term: "Prefecture and JIS code", topic: "Regions", page: "#/regions", definition: "Japan has 47 prefectures, numbered 01 (Hokkaido) to 47 (Okinawa) by the JIS X 0401 standard, roughly north to south." },
  { term: "GDP per capita (prefectural)", topic: "Regions", page: "#/regions", definition: "A prefecture's output divided by its residents. Tokyo is high partly because commuters from nearby prefectures work there." },
  { term: "Preliminary (prelim.) / provisional (Prov.)", topic: "Method", page: "#/sources", definition: "Early figures an agency publishes before its final count; they are usually revised slightly months later." },
  { term: "Seasonally adjusted", topic: "Method", page: "#/catalog", definition: "Monthly figures with the usual calendar pattern (holidays, harvests, bonuses) removed, so one month can be compared with the next." },
];

const TOPICS = ["All", "Economy", "Prices", "Population", "Labour", "Regions", "Method"];

const PAGE_NAMES = { "#/": "Overview", "#/regions": "Prefectures", "#/demographics": "Population", "#/economy": "Economy", "#/society": "Society", "#/catalog": "Catalog", "#/sources": "Sources" };

/** Terms that match the topic tab and the search text. */
function matchingTerms(topic, query) {
  const needle = query.trim().toLowerCase();
  return GLOSSARY_TERMS.filter((entry) => (topic === "All" || entry.topic === topic) && (!needle || `${entry.term} ${entry.definition}`.toLowerCase().includes(needle)));
}

/** Render the glossary page for the saved state. */
export function renderGlossaryView(state) {
  const topic = TOPICS.includes(state.glossaryTopic) ? state.glossaryTopic : "All";
  const query = state.glossaryQuery || "";
  const terms = matchingTerms(topic, query);
  const tabs = TOPICS.map((t) => `<button type="button" class="seg-btn${t === topic ? " is-active" : ""}" data-glossary-topic="${t}">${t}</button>`).join("");
  const cards = terms
    .map(
      (entry) => `
      <article class="term-card">
        <div class="term-head"><h3>${escapeHtml(entry.term)}</h3><span class="badge badge-neutral">${escapeHtml(entry.topic)}</span></div>
        <p>${escapeHtml(entry.definition)}</p>
        <a class="term-link" href="${entry.page}">Seen on ${escapeHtml(PAGE_NAMES[entry.page] || "Overview")} →</a>
      </article>`,
    )
    .join("");
  return `
    <section class="context-banner">
      <div class="context-headline">
        <h1>How to read these statistics</h1>
        <p class="context-sub">${GLOSSARY_TERMS.length} terms used across the almanac, explained in plain language, each linked to where it appears.</p>
      </div>
      <div class="context-meta"><a class="btn btn-subtle" href="#/sources">Where the numbers come from →</a></div>
    </section>
    <section class="toolbar-strip">
      <div class="seg-group" role="tablist" aria-label="Glossary topics">${tabs}</div>
      <div>
        <label class="sr-only" for="glossary-query">Search terms</label>
        <input id="glossary-query" class="field-input glossary-search" type="search" placeholder="Search a term, e.g. CPI" value="${escapeHtml(query)}" />
      </div>
    </section>
    <section class="term-grid" aria-label="Glossary terms">${cards || `<p class="panel">No term matches “${escapeHtml(query)}”.</p>`}</section>`;
}

/** Wire the topic tabs and the search box. */
export function bindGlossaryInteractions(root, state, persistState) {
  root.querySelectorAll("[data-glossary-topic]").forEach((tab) => {
    tab.addEventListener("click", () => persistState({ glossaryTopic: tab.getAttribute("data-glossary-topic") }));
  });
  const input = root.querySelector("#glossary-query");
  input?.addEventListener("change", () => persistState({ glossaryQuery: input.value }));
}
