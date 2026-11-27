// National Accounts Expenditure, CPI Basket Contributions (2020=100), Electricity Mix (METI FY2024),
// Merchandise Trade Partners (MOF CY2024), and Household Income Percentiles (MHLW / MIC).

export const CPI_BASKET_2024 = [
  { label: "Food & Non-Alc.", weight: 26.3, yoy: 4.3, value: 1.08, display: "+1.08 pp", color: "#C43A27" },
  { label: "Culture & Services", weight: 9.1, yoy: 5.4, value: 0.49, display: "+0.49 pp", color: "#1B4F72" },
  { label: "Fuel, Light & Water", weight: 6.9, yoy: 4.5, value: 0.31, display: "+0.31 pp", color: "#A86814" },
  { label: "Furniture & Utensils", weight: 3.9, yoy: 6.6, value: 0.26, display: "+0.26 pp", color: "#2F6690" },
  { label: "Transport & Comm.", weight: 14.9, yoy: 1.4, value: 0.21, display: "+0.21 pp", color: "#1E6B52" },
  { label: "Housing (Imputed/Rent)", weight: 21.5, yoy: 0.7, value: 0.15, display: "+0.15 pp", color: "#556171" },
];

export const ELECTRICITY_MIX_FY24 = [
  { label: "LNG Thermal", short: "LNG", share: 31.8, color: "#1B4F72" },
  { label: "Coal Thermal", short: "Coal", share: 28.6, color: "#4A5565" },
  { label: "Solar PV", short: "Solar", share: 9.9, color: "#D48817" },
  { label: "Nuclear Baseload", short: "Nuclear", share: 9.4, color: "#7B3F8C" },
  { label: "Hydroelectric", short: "Hydro", share: 7.4, color: "#2B8CBE" },
  { label: "Oil & Other Thermal", short: "Oil/Oth", share: 7.1, color: "#8C6D53" },
  { label: "Biomass, Wind & Geo.", short: "Bio/Wind", share: 5.8, color: "#1E6B52" },
];

export const TRADE_PARTNERS_2024 = [
  { partner: "United States", exportsT: 21.30, importsT: 12.66, balanceT: 8.64, leadItem: "Motor vehicles & parts" },
  { partner: "China", exportsT: 18.86, importsT: 25.31, balanceT: -6.45, leadItem: "Chip tools / Smartphones" },
  { partner: "ASEAN-10", exportsT: 14.92, importsT: 15.88, balanceT: -0.96, leadItem: "ICs, steel & LNG" },
  { partner: "European Union", exportsT: 9.91, importsT: 12.15, balanceT: -2.24, leadItem: "Hybrid autos & pharma" },
  { partner: "South Korea", exportsT: 7.06, importsT: 4.86, balanceT: 2.20, leadItem: "Chemicals & wafer equip." },
  { partner: "Taiwan", exportsT: 6.94, importsT: 5.42, balanceT: 1.52, leadItem: "Foundry machinery & ICs" },
  { partner: "Australia", exportsT: 2.48, importsT: 9.38, balanceT: -6.90, leadItem: "LNG, coal & iron ore" },
  { partner: "UAE & Saudi Arabia", exportsT: 2.34, importsT: 10.62, balanceT: -8.28, leadItem: "Crude petroleum" },
];

export const HOUSEHOLD_DECILES_MAN_YEN = [
  { p: 10, annualMan: 135 },
  { p: 25, annualMan: 248 },
  { p: 50, annualMan: 410 }, // National median ~¥4.10M (MHLW Comprehensive Survey of Living Conditions)
  { p: 75, annualMan: 685 },
  { p: 90, annualMan: 980 },
  { p: 95, annualMan: 1260 },
];