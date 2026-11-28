// Society & Living reference data: health, ageing, households, housing, safety, land and
// environment. Every figure carries its official source, reference period and a plain note.
// Figures are the latest final or preliminary editions published by the named agencies.

/** Themes shown as filter chips on the Society & Living page, in display order. */
export const SOCIETY_THEMES = [
  { id: "health", label: "Health & Longevity", accent: "jade" },
  { id: "ageing", label: "Ageing Society", accent: "ochre" },
  { id: "vital", label: "Births, Deaths & Marriage", accent: "vermilion" },
  { id: "homes", label: "Households & Housing", accent: "indigo" },
  { id: "safety", label: "Safety", accent: "vermilion" },
  { id: "land", label: "Land, Energy & Climate", accent: "jade" },
  { id: "people", label: "Mobility & Residents", accent: "indigo" },
];

/**
 * One fact card per indicator. `value` is the display figure, `raw` the plain number used for
 * sorting and CSV export, `period` the reference date or year, `source` the publishing agency
 * and release, `note` one sentence a reader can act on.
 */
export const SOCIETY_FACTS = [
  { id: "le-men", theme: "health", label: "Life expectancy at birth, men", value: "81.09 yrs", raw: 81.09, unit: "years", period: "2023", source: "MHLW · Abridged Life Tables 2023", note: "Up 0.04 years on 2022; still below the 2020 peak of 81.56." },
  { id: "le-women", theme: "health", label: "Life expectancy at birth, women", value: "87.14 yrs", raw: 87.14, unit: "years", period: "2023", source: "MHLW · Abridged Life Tables 2023", note: "Among the highest in the world; women outlive men by 6.05 years." },
  { id: "imr", theme: "health", label: "Infant mortality rate", value: "1.8 ‰", raw: 1.8, unit: "per 1,000 live births", period: "2023", source: "MHLW · Vital Statistics 2023", note: "Fewer than 2 in 1,000 babies die before their first birthday." },
  { id: "physicians", theme: "health", label: "Practising physicians", value: "343,275", raw: 343275, unit: "persons", period: "31 Dec 2022", source: "MHLW · Survey of Physicians, Dentists and Pharmacists 2022", note: "About 262 doctors per 100,000 people, unevenly spread between prefectures." },
  { id: "medcost", theme: "health", label: "National medical care expenditure", value: "¥46.7T", raw: 46.7, unit: "¥ trillion", period: "FY2022", source: "MHLW · Estimates of National Medical Care Expenditure", note: "Roughly ¥373,700 per resident; the 65+ account for over 60% of it." },
  { id: "aged65", theme: "ageing", label: "Residents aged 65 and over", value: "36.25M", raw: 36.25, unit: "million", period: "15 Sep 2024", source: "MIC Statistics Bureau · Population Estimates (Respect for the Aged Day release)", note: "29.3% of the population, the highest share of any country of 100,000+ people." },
  { id: "aged75", theme: "ageing", label: "Residents aged 75 and over", value: "20.76M", raw: 20.76, unit: "million", period: "15 Sep 2024", source: "MIC Statistics Bureau · Population Estimates", note: "16.8% of the population: one person in six." },
  { id: "centenarians", theme: "ageing", label: "Centenarians", value: "95,119", raw: 95119, unit: "persons", period: "1 Sep 2024", source: "MHLW · Centenarian count", note: "88% are women; the count has risen for 54 years running." },
  { id: "births", theme: "vital", label: "Live births (Japanese nationals)", value: "686,061", raw: 686061, unit: "births", period: "2024 (prelim.)", source: "MHLW · Vital Statistics, preliminary 2024", note: "First year below 700,000 since records began in 1899." },
  { id: "deaths", theme: "vital", label: "Deaths (Japanese nationals)", value: "1,605,298", raw: 1605298, unit: "deaths", period: "2024 (prelim.)", source: "MHLW · Vital Statistics, preliminary 2024", note: "A record high, driven by the size of the post-war generation." },
  { id: "natural", theme: "vital", label: "Natural decrease", value: "−919,237", raw: -919237, unit: "persons", period: "2024 (prelim.)", source: "MHLW · Vital Statistics (births minus deaths)", note: "Japan loses a city the size of Chiba every year to natural decrease." },
  { id: "marriages", theme: "vital", label: "Marriages", value: "499,999", raw: 499999, unit: "couples", period: "2024 (prelim.)", source: "MHLW · Vital Statistics, preliminary 2024", note: "Half the 1972 peak of about 1.1 million." },
  { id: "households", theme: "homes", label: "Private households", value: "55.7M", raw: 55.7, unit: "million", period: "1 Oct 2020", source: "MIC Statistics Bureau · 2020 Population Census", note: "Average household size is 2.21 persons, the smallest on record." },
  { id: "single", theme: "homes", label: "One-person households", value: "38.0%", raw: 38, unit: "% of households", period: "1 Oct 2020", source: "MIC Statistics Bureau · 2020 Population Census", note: "The most common household type, ahead of couples with children (25.0%)." },
  { id: "dwellings", theme: "homes", label: "Dwellings", value: "65.04M", raw: 65.04, unit: "million", period: "1 Oct 2023", source: "MIC Statistics Bureau · 2023 Housing and Land Survey", note: "More homes than households: the stock grew 4.2% in five years." },
  { id: "vacant", theme: "homes", label: "Vacant dwellings", value: "9.00M", raw: 9, unit: "million", period: "1 Oct 2023", source: "MIC Statistics Bureau · 2023 Housing and Land Survey", note: "A record 13.8% of all dwellings stand empty (akiya)." },
  { id: "traffic", theme: "safety", label: "Road traffic deaths (within 24 h)", value: "2,663", raw: 2663, unit: "deaths", period: "2024", source: "National Police Agency · Traffic accident statistics", note: "Down from 16,765 in 1970; about half of those killed are 65 or older." },
  { id: "suicide", theme: "safety", label: "Suicides", value: "21,837", raw: 21837, unit: "deaths", period: "2023", source: "MHLW / National Police Agency · Suicide statistics 2023", note: "Help is available around the clock: Yorisoi Hotline 0120-279-338." },
  { id: "area", theme: "land", label: "Land area", value: "377,975 km²", raw: 377975, unit: "km²", period: "2024", source: "Geospatial Information Authority of Japan · Area survey", note: "Spread over 14,125 islands, per the GSI's 2023 recount." },
  { id: "forest", theme: "land", label: "Forest cover", value: "≈ 67%", raw: 67, unit: "% of land", period: "2022", source: "Forestry Agency · Forest resources", note: "About two-thirds of the land is forest; roughly 40% of it was planted." },
  { id: "renew", theme: "land", label: "Renewables in power generation", value: "22.9%", raw: 22.9, unit: "% of generation", period: "FY2023", source: "METI ANRE · Energy Supply and Demand (preliminary)", note: "Solar supplies about 10%; the 2030 target is 36–38%." },
  { id: "ghg", theme: "land", label: "Greenhouse-gas emissions", value: "1,135 Mt", raw: 1135, unit: "Mt CO₂e", period: "FY2022", source: "Ministry of the Environment · GHG Inventory", note: "22.9% below FY2013; net zero is legislated for 2050." },
  { id: "foreign", theme: "people", label: "Foreign residents", value: "3.77M", raw: 3.769, unit: "million", period: "31 Dec 2024", source: "Immigration Services Agency · Foreign resident statistics", note: "A record 3.0% of the population; China, Vietnam and Korea lead." },
  { id: "outbound", theme: "people", label: "Japanese outbound travellers", value: "13.00M", raw: 13.0, unit: "million", period: "2024", source: "JNTO · Visitor arrivals and departures", note: "Still two-thirds of the 2019 level of 20.08 million." },
  { id: "municipalities", theme: "people", label: "Municipalities", value: "1,718", raw: 1718, unit: "cities, towns, villages", period: "2024", source: "MIC · Local government directory", note: "Plus Tokyo's 23 special wards, across 47 prefectures." },
];

/** Life expectancy at birth by sex, selected years (MHLW Complete/Abridged Life Tables). */
export const LIFE_EXPECTANCY_SERIES = [
  { year: 1960, men: 65.32, women: 70.19 },
  { year: 1980, men: 73.35, women: 78.76 },
  { year: 2000, men: 77.72, women: 84.6 },
  { year: 2010, men: 79.55, women: 86.3 },
  { year: 2020, men: 81.56, women: 87.71 },
  { year: 2023, men: 81.09, women: 87.14 },
];

/** Share of the population aged 65 and over (%), census years and the latest estimate (MIC). */
export const AGED_SHARE_SERIES = [
  { year: 1950, share: 4.9 },
  { year: 1970, share: 7.1 },
  { year: 1980, share: 9.1 },
  { year: 1990, share: 12.1 },
  { year: 2000, share: 17.4 },
  { year: 2010, share: 23.0 },
  { year: 2020, share: 28.6 },
  { year: 2024, share: 29.3 },
];

/** Private households by family type, 2020 Census (share of all private households, %). */
export const HOUSEHOLD_MIX_2020 = [
  { type: "One person", share: 38.0, tone: "indigo" },
  { type: "Couple only", share: 20.1, tone: "jade" },
  { type: "Couple with children", share: 25.0, tone: "ochre" },
  { type: "Single parent with children", share: 9.0, tone: "vermilion" },
  { type: "Other", share: 7.9, tone: "muted" },
];
