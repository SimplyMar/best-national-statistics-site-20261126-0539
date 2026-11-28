// "Japan at a glance" strip for the Overview: six everyday figures about how people in Japan
// live, drawn from the Society & Living data, each linking to its page with its year.

/** The glance figures, in display order. Values repeat the sourced figures of society-data.js. */
export const GLANCE_ITEMS = [
  { icon: "♥", value: "87.1 / 81.1", label: "Life expectancy, women / men", period: "2023", href: "#/society" },
  { icon: "◔", value: "29.3%", label: "Residents aged 65 and over", period: "Sep 2024", href: "#/society" },
  { icon: "⌂", value: "38%", label: "Households of one person", period: "2020 Census", href: "#/society" },
  { icon: "▣", value: "13.8%", label: "Homes standing vacant", period: "2023", href: "#/society" },
  { icon: "✚", value: "−919k", label: "Natural decrease (births − deaths)", period: "2024 prelim.", href: "#/society" },
  { icon: "✈", value: "36.9M", label: "Visitors to Japan", period: "2024", href: "#/catalog" },
];

/** Render the strip as a row of linked tiles. */
export function renderGlanceStrip() {
  const tiles = GLANCE_ITEMS.map(
    (item) => `
      <a class="glance-tile" href="${item.href}">
        <span class="glance-icon" aria-hidden="true">${item.icon}</span>
        <span class="glance-value num">${item.value}</span>
        <span class="glance-label">${item.label}</span>
        <span class="glance-period">${item.period}</span>
      </a>`,
  ).join("");
  return `<section class="glance-strip" aria-label="Japan at a glance"><h2 class="glance-title">Japan at a glance</h2><div class="glance-row">${tiles}</div></section>`;
}
