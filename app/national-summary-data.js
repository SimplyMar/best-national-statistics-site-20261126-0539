// Headline indicators, 10-year macroeconomic series, CPI index levels, and release schedule for Japan.

export const HEADLINE_KPIS = [
  { id: "population", domain: "Demographics", label: "Total Population", value: "123.80M", delta: "-0.44% YoY", tone: "warn", period: "Oct 2024", source: "MIC Pop. Estimates", route: "#/demographics", color: "#1B4F72", series: [127.09, 126.93, 126.71, 126.44, 126.17, 126.15, 125.50, 124.95, 124.35, 123.80] },
  { id: "gdp", domain: "National Accounts", label: "Nominal GDP (CY)", value: "¥609.3T", delta: "+2.9% nom · +0.1% real", tone: "up", period: "CY 2024", source: "Cabinet Office ESRI", route: "#/economy", color: "#1E6B52", series: [538.0, 544.4, 553.1, 556.6, 557.9, 539.8, 552.6, 562.2, 591.9, 609.3] },
  { id: "cpi", domain: "Prices (2020=100)", label: "Core CPI Inflation", value: "+2.5%", delta: "All items idx 108.5", tone: "warn", period: "CY 2024 Avg", source: "MIC Statistics Bureau", route: "#/economy", color: "#C43A27", series: [0.5, -0.3, 0.5, 0.9, 0.6, -0.2, -0.2, 2.3, 3.1, 2.5] },
  { id: "unemployment", domain: "Labor Market", label: "Unemployment Rate", value: "2.5%", delta: "-0.1 pp · 67.81M emp", tone: "up", period: "CY 2024 Avg", source: "MIC Labour Force", route: "#/demographics", color: "#1E6B52", series: [3.4, 3.1, 2.8, 2.4, 2.4, 2.8, 2.8, 2.6, 2.6, 2.5] },
  { id: "tfr", domain: "Vital Statistics", label: "Total Fertility Rate", value: "1.15", delta: "686k live births", tone: "warn", period: "2024 Prov.", source: "MHLW Vital Stats", route: "#/demographics", color: "#C43A27", series: [1.45, 1.44, 1.43, 1.42, 1.36, 1.33, 1.30, 1.26, 1.20, 1.15] },
  { id: "trade", domain: "External Sector", label: "Merchandise Trade", value: "-¥5.33T", delta: "Exp ¥107.1T (+6.2%)", tone: "neutral", period: "CY 2024", source: "MOF Customs Stats", route: "#/economy", color: "#1B4F72", series: [-2.79, 3.99, 2.91, -1.23, -1.66, 0.39, -1.79, -20.29, -9.52, -5.33] },
  { id: "policy_rate", domain: "Monetary Policy", label: "BOJ Policy Rate", value: "0.50%", delta: "+60 bp from -0.10%", tone: "ochre", period: "Jan 2025", source: "Bank of Japan", route: "#/economy", color: "#A86814", series: [0.05, -0.10, -0.10, -0.10, -0.10, -0.10, -0.10, -0.10, 0.10, 0.50] },
  { id: "tourism", domain: "Inbound Economy", label: "Inbound Visitors", value: "36.87M", delta: "+47.1% · ¥8.14T spend", tone: "up", period: "CY 2024", source: "JNTO / JTA", route: "#/catalog", color: "#1E6B52", series: [19.74, 24.04, 28.69, 31.19, 31.88, 4.12, 0.25, 3.83, 25.07, 36.87] },
];

export const MACRO_DECADE = [
  { year: 2015, nominalGdpT: 538.0, realGrowthPct: 1.6, coreCpiPct: 0.5, cpiAllIdx: 98.2, bojRatePct: 0.05, exportsT: 75.61, importsT: 78.41, realWageYoY: -0.9, nominalWageK: 314.0 },
  { year: 2016, nominalGdpT: 544.4, realGrowthPct: 0.8, coreCpiPct: -0.3, cpiAllIdx: 98.1, bojRatePct: -0.10, exportsT: 70.04, importsT: 66.04, realWageYoY: 0.7, nominalWageK: 315.6 },
  { year: 2017, nominalGdpT: 553.1, realGrowthPct: 1.7, coreCpiPct: 0.5, cpiAllIdx: 98.6, bojRatePct: -0.10, exportsT: 78.29, importsT: 75.38, realWageYoY: -0.2, nominalWageK: 316.9 },
  { year: 2018, nominalGdpT: 556.6, realGrowthPct: 0.6, coreCpiPct: 0.9, cpiAllIdx: 99.6, bojRatePct: -0.10, exportsT: 81.48, importsT: 82.70, realWageYoY: 0.2, nominalWageK: 323.6 },
  { year: 2019, nominalGdpT: 557.9, realGrowthPct: -0.4, coreCpiPct: 0.6, cpiAllIdx: 100.0, bojRatePct: -0.10, exportsT: 76.93, importsT: 78.60, realWageYoY: -1.0, nominalWageK: 322.6 },
  { year: 2020, nominalGdpT: 539.8, realGrowthPct: -4.2, coreCpiPct: -0.2, cpiAllIdx: 100.0, bojRatePct: -0.10, exportsT: 68.40, importsT: 68.01, realWageYoY: -1.2, nominalWageK: 318.4 },
  { year: 2021, nominalGdpT: 552.6, realGrowthPct: 2.7, coreCpiPct: -0.2, cpiAllIdx: 99.8, bojRatePct: -0.10, exportsT: 83.09, importsT: 84.88, realWageYoY: 0.5, nominalWageK: 319.5 },
  { year: 2022, nominalGdpT: 562.2, realGrowthPct: 0.9, coreCpiPct: 2.3, cpiAllIdx: 102.3, bojRatePct: -0.10, exportsT: 98.19, importsT: 118.48, realWageYoY: -1.0, nominalWageK: 326.2 },
  { year: 2023, nominalGdpT: 591.9, realGrowthPct: 1.5, coreCpiPct: 3.1, cpiAllIdx: 105.6, bojRatePct: -0.10, exportsT: 100.89, importsT: 110.41, realWageYoY: -2.5, nominalWageK: 329.9 },
  { year: 2024, nominalGdpT: 609.3, realGrowthPct: 0.1, coreCpiPct: 2.5, cpiAllIdx: 108.5, bojRatePct: 0.25, exportsT: 107.09, importsT: 112.42, realWageYoY: -0.2, nominalWageK: 339.5 },
];

export const RELEASE_CALENDAR = [
  { date: "2025-02-17", agency: "ESRI", title: "Quarterly GDP First Preliminary (Q4 2024)", route: "#/economy", status: "Published" },
  { date: "2025-02-21", agency: "MIC", title: "National Consumer Price Index (Jan 2025, 2020=100)", route: "#/economy", status: "Published" },
  { date: "2025-02-27", agency: "MHLW", title: "Vital Statistics Preliminary Annual Report (CY 2024)", route: "#/demographics", status: "Published" },
  { date: "2025-04-14", agency: "MIC", title: "Current Population Estimates by Prefecture (Oct 2024)", route: "#/regions", status: "Benchmark" },
];