// Data audit for Retto Almanac: every figure the site shows must carry a value, a reference
// period and a source; ids and codes must be unique; shares that should add up to 100 must.
// Run before taking screenshots:  node tools/check-data.mjs
import { HEADLINE_KPIS, MACRO_DECADE } from "../app/national-summary-data.js";
import { INDICATOR_CATALOG } from "../app/catalog-data.js";
import { HOUSEHOLD_MIX_2020, LIFE_EXPECTANCY_SERIES, SOCIETY_FACTS, SOCIETY_THEMES } from "../app/society-data.js";
import { PREFECTURES_47 } from "../app/prefectures-data.js";
import { GLOSSARY_TERMS } from "../app/glossary-view.js";
import { allFigures, AGENCY_DIRECTORY } from "../app/sources-view.js";

const problems = [];
const need = (condition, message) => {
  if (!condition) problems.push(message);
};
const blank = (text) => typeof text !== "string" || text.trim() === "";

/** Each listed field of each row must be a non-blank string. */
function requireFields(rows, fields, label) {
  rows.forEach((row, index) => {
    for (const field of fields) need(!blank(row[field]), `${label} #${index + 1} (${row.id ?? row.code ?? row.label ?? row.term}) has no ${field}`);
  });
}

/** Values of `key` must not repeat. */
function requireUnique(rows, key, label) {
  const seen = new Set();
  for (const row of rows) {
    need(!seen.has(row[key]), `${label}: duplicate ${key} ${row[key]}`);
    seen.add(row[key]);
  }
}

requireFields(HEADLINE_KPIS, ["id", "label", "value", "period", "source"], "Headline KPI");
requireUnique(HEADLINE_KPIS, "id", "Headline KPIs");
requireFields(INDICATOR_CATALOG, ["code", "title", "latest", "period", "agency", "survey"], "Catalog series");
requireUnique(INDICATOR_CATALOG, "code", "Catalog");
requireFields(SOCIETY_FACTS, ["id", "label", "value", "period", "source", "note"], "Society fact");
requireUnique(SOCIETY_FACTS, "id", "Society facts");
requireFields(GLOSSARY_TERMS, ["term", "topic", "page", "definition"], "Glossary term");
requireUnique(GLOSSARY_TERMS, "term", "Glossary");

const themeIds = new Set(SOCIETY_THEMES.map((theme) => theme.id));
for (const fact of SOCIETY_FACTS) {
  need(themeIds.has(fact.theme), `Society fact ${fact.id} names unknown theme ${fact.theme}`);
  need(Number.isFinite(fact.raw), `Society fact ${fact.id} has no numeric raw value`);
}
for (const theme of SOCIETY_THEMES) need(SOCIETY_FACTS.some((fact) => fact.theme === theme.id), `Theme ${theme.id} has no facts`);

const householdTotal = HOUSEHOLD_MIX_2020.reduce((sum, part) => sum + part.share, 0);
need(Math.abs(householdTotal - 100) < 0.05, `Household shares add to ${householdTotal.toFixed(1)}, not 100`);
need(LIFE_EXPECTANCY_SERIES.every((p, i, all) => i === 0 || p.year > all[i - 1].year), "Life expectancy years are not ascending");
need(MACRO_DECADE.length === 10 && MACRO_DECADE.every((r, i) => r.year === 2015 + i), "Macro decade is not 2015 to 2024");

need(PREFECTURES_47.length === 47, `Expected 47 prefectures, found ${PREFECTURES_47.length}`);
requireUnique(PREFECTURES_47, "code", "Prefectures");
const prefTotal = PREFECTURES_47.reduce((sum, p) => sum + p.popM, 0);
need(Math.abs(prefTotal - 123.8) < 1.5, `Prefecture populations add to ${prefTotal.toFixed(2)}M, far from the national 123.80M`);

const figures = allFigures();
const agencyKeys = new Set(AGENCY_DIRECTORY.map((agency) => agency.key));
need(agencyKeys.size === AGENCY_DIRECTORY.length, "Agency directory has duplicate keys");
requireFields(figures, ["label", "value", "period", "source", "page"], "Figure finder row");

if (problems.length) {
  console.error(`DATA AUDIT FAILED (${problems.length}):\n- ${problems.join("\n- ")}`);
  process.exit(1);
}
console.log(`DATA AUDIT OK · ${figures.length} sourced figures · ${PREFECTURES_47.length} prefectures (sum ${prefTotal.toFixed(2)}M) · ${GLOSSARY_TERMS.length} glossary terms · households ${householdTotal.toFixed(1)}%`);
