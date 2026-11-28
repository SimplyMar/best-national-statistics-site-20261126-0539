// The geographic map of Japan used on the overview and the prefecture atlas: hand-traced coastlines with one
// bubble per prefecture at its real position, sized by population and coloured by the chosen indicator's
// bins, Okinawa in an inset. Returns an SVG string; clicks are bound by the views through data-pref-code.

import { COASTLINES, MAINLAND_BOUNDS, OKINAWA_BOUNDS, PREFECTURE_CENTRES } from "./prefecture-geo.js";
import { escapeHtml } from "./export-utils.js";

const SEA = "#E9F0F4";
const LAND = "#F4EFE2";
const COAST = "#C9BFA6";
const SELECTED = "#C43A27";
const INK = "#141920";

/** A projection of a lat/lon frame into a pixel box, keeping the shape (longitudes shrunk by cos(latitude)). */
function makeProjection(bounds, box) {
  const midLat = ((bounds.north + bounds.south) / 2) * (Math.PI / 180);
  const squeeze = Math.cos(midLat);
  const spanX = (bounds.east - bounds.west) * squeeze;
  const spanY = bounds.north - bounds.south;
  const scale = Math.min(box.width / spanX, box.height / spanY);
  const left = box.x + (box.width - spanX * scale) / 2;
  const top = box.y + (box.height - spanY * scale) / 2;
  return ([lat, lon]) => [left + (lon - bounds.west) * squeeze * scale, top + (bounds.north - lat) * scale];
}

/** An SVG path for one closed coastline ring. */
function ringPath(ring, project) {
  return ring.map((point, index) => {
    const [x, y] = project(point);
    return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ") + " Z";
}

/** The fill of a value under a metric's bins. */
export function binColour(metricMeta, value) {
  for (let i = 0; i < metricMeta.bins.length; i += 1) {
    if (value <= metricMeta.bins[i]) return metricMeta.palette[i];
  }
  return metricMeta.palette[metricMeta.palette.length - 1];
}

/** White or ink text, whichever reads on a fill. */
function textOn(hex) {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b < 150 ? "#FFFFFF" : INK;
}

/**
 * Place name labels beside their bubbles, west of Kyoto on the left and east of it on the right, pushing a label
 * down (with a leader line back to its bubble) while it would overlap one already placed.
 */
function placeLabels(items, fontSize) {
  const placed = [];
  const boxes = [];
  const overlaps = (box) => boxes.some((b) => box.left < b.right && box.right > b.left && box.top < b.bottom && box.bottom > b.top);
  for (const item of [...items].sort((a, b) => a.y - b.y)) {
    const west = PREFECTURE_CENTRES[item.p.code][1] < 136.5 && item.p.code !== "01";
    const anchor = west ? "end" : "start";
    const textWidth = item.text.length * fontSize * 0.56;
    let lx = west ? item.x - item.r - 3 : item.x + item.r + 3;
    let ly = item.y + fontSize * 0.35;
    let moved = false;
    const boxAt = () => ({ left: west ? lx - textWidth : lx, right: west ? lx : lx + textWidth, top: ly - fontSize, bottom: ly + 2 });
    for (let tries = 0; tries < 12 && overlaps(boxAt()); tries += 1) {
      if (!moved) lx += west ? -12 : 12;
      ly += fontSize + 2;
      moved = true;
    }
    boxes.push(boxAt());
    placed.push({ ...item, lx, ly, anchor, moved });
  }
  return placed;
}

/**
 * The bubble map. Options: width and height of the SVG, the selected prefecture code, the codes being compared,
 * how many of the most populous prefectures get a name label, and whether to draw the legend.
 */
export function renderPrefectureBubbleMap(prefectures, metricMeta, options = {}) {
  const { width = 600, height = 560, selectedCode = "", compareCodes = [], labelCount = 8, legend = true, title = "" } = options;
  const pad = 10;
  const project = makeProjection(MAINLAND_BOUNDS, { x: pad, y: pad + (title ? 18 : 0), width: width - pad * 2, height: height - pad * 2 - (title ? 18 : 0) });
  const insetSize = Math.round(Math.min(width, height) * 0.2);
  const insetBox = { x: pad + 6, y: pad + (title ? 24 : 6), width: insetSize, height: insetSize };
  const projectInset = makeProjection(OKINAWA_BOUNDS, { x: insetBox.x + 6, y: insetBox.y + 14, width: insetBox.width - 12, height: insetBox.height - 20 });

  const largest = Math.max(...prefectures.map((p) => p.popM));
  const unit = Math.min(width, height) / 560;
  const textUnit = Math.max(1, unit);
  const sizeUnit = Math.max(0.85, unit);
  const radiusOf = (pop) => (3.4 + 14.5 * Math.sqrt(pop / largest)) * sizeUnit;
  const compareSet = new Set(compareCodes);
  const labelled = new Set([...prefectures].sort((a, b) => b.popM - a.popM).slice(0, labelCount).map((p) => p.code));
  if (selectedCode) labelled.add(selectedCode);

  const land = ["hokkaido", "honshu", "shikoku", "kyushu"].map((island) => `<path d="${ringPath(COASTLINES[island], project)}" fill="${LAND}" stroke="${COAST}" stroke-width="1" stroke-linejoin="round" />`).join("");
  const okinawaLand = `<path d="${ringPath(COASTLINES.okinawa, projectInset)}" fill="${LAND}" stroke="${COAST}" stroke-width="1" />`;

  const graticule = [35, 40, 45].map((lat) => {
    const [, y] = project([lat, MAINLAND_BOUNDS.west]);
    return `<line x1="${pad}" x2="${width - pad}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#D6E1E8" stroke-dasharray="2 4" /><text x="${width - pad - 2}" y="${(y - 3).toFixed(1)}" text-anchor="end" font-size="${(9 * textUnit).toFixed(1)}" fill="#7A8FA0">${lat}°N</text>`;
  }).join("");

  // Largest first so small prefectures stay visible on top; the selected one last of all.
  const drawOrder = [...prefectures].sort((a, b) => (a.code === selectedCode) - (b.code === selectedCode) || b.popM - a.popM);
  const bubbles = drawOrder.map((p) => {
    const centre = PREFECTURE_CENTRES[p.code];
    if (!centre) return "";
    const [x, y] = p.code === "47" ? projectInset(centre) : project(centre);
    const r = radiusOf(p.popM);
    const value = p[metricMeta.key];
    const fill = binColour(metricMeta, value);
    const isSelected = p.code === selectedCode;
    const isCompared = compareSet.has(p.code);
    return `<g class="pref-cell map-bubble" data-pref-code="${p.code}" tabindex="0">
      <title>${escapeHtml(p.name)} (${escapeHtml(p.region)}): ${escapeHtml(metricMeta.format(value))} · population ${p.popM.toFixed(2)}M</title>
      <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${fill}" fill-opacity="0.88" stroke="${isSelected ? SELECTED : isCompared ? INK : textOn(fill) === INK ? "#8C8270" : "#FFFFFF"}" stroke-width="${isSelected ? 2.6 : isCompared ? 1.6 : 0.9}" />
    </g>`;
  }).join("");

  const labels = placeLabels(prefectures.filter((p) => labelled.has(p.code) && PREFECTURE_CENTRES[p.code]).map((p) => {
    const [x, y] = p.code === "47" ? projectInset(PREFECTURE_CENTRES[p.code]) : project(PREFECTURE_CENTRES[p.code]);
    return { p, x, y, r: radiusOf(p.popM), text: `${p.name} ${metricMeta.shortFormat(p[metricMeta.key])}` };
  }), 11 * textUnit).map(({ p, x, y, r, lx, ly, anchor, moved, text }) => {
    const fontSize = 11 * textUnit;
    const leader = moved ? `<line x1="${(anchor === "end" ? x - r : x + r).toFixed(1)}" y1="${y.toFixed(1)}" x2="${(anchor === "end" ? lx + 1 : lx - 1).toFixed(1)}" y2="${(ly - fontSize * 0.35).toFixed(1)}" stroke="#6F8293" stroke-width="0.8" />` : "";
    return `${leader}<text class="map-label" x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${anchor}" font-size="${fontSize.toFixed(1)}" font-weight="${p.code === selectedCode ? 800 : 650}" fill="${p.code === selectedCode ? SELECTED : INK}" paint-order="stroke" stroke="${SEA}" stroke-width="${(3 * textUnit).toFixed(1)}">${escapeHtml(text)}</text>`;
  }).join("");

  let legendSvg = "";
  if (legend) {
    const swatch = 42 * unit;
    const lx = width - pad - swatch * 5 - 6;
    const ly = height - pad - 62 * unit;
    const rows = metricMeta.palette.map((colour, index) => `<rect x="${(lx + index * swatch).toFixed(1)}" y="${ly.toFixed(1)}" width="${(swatch - 2).toFixed(1)}" height="${(9 * unit).toFixed(1)}" rx="2" fill="${colour}" /><text x="${(lx + index * swatch + swatch / 2 - 1).toFixed(1)}" y="${(ly + 20 * unit).toFixed(1)}" text-anchor="middle" font-size="${(7.6 * unit).toFixed(1)}" fill="#3B4A57">${escapeHtml(metricMeta.binLabels[index])}</text>`).join("");
    const one = radiusOf(1), ten = radiusOf(10);
    const sx = lx + ten;
    const sy = ly + 30 * unit + ten;
    legendSvg = `<g class="map-legend">
      <text x="${lx.toFixed(1)}" y="${(ly - 6 * unit).toFixed(1)}" font-size="${(8.6 * unit).toFixed(1)}" font-weight="700" fill="${INK}">Colour: ${escapeHtml(metricMeta.label)}</text>
      ${rows}
      <circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="${ten.toFixed(1)}" fill="none" stroke="#7A8FA0" />
      <circle cx="${sx.toFixed(1)}" cy="${(sy + ten - one).toFixed(1)}" r="${one.toFixed(1)}" fill="none" stroke="#7A8FA0" />
      <text x="${(sx + ten + 5).toFixed(1)}" y="${(sy + 3).toFixed(1)}" font-size="${(8 * unit).toFixed(1)}" fill="#3B4A57">Size: population (1M, 10M)</text>
    </g>`;
  }

  return `<svg class="japan-map" viewBox="0 0 ${width} ${height}" role="img" aria-label="Map of Japan's 47 prefectures: ${escapeHtml(metricMeta.label)}">
    <rect width="${width}" height="${height}" rx="8" fill="${SEA}" />
    ${title ? `<text x="${pad + 2}" y="${pad + 12}" font-size="${(11.5 * unit).toFixed(1)}" font-weight="700" fill="${INK}">${escapeHtml(title)}</text>` : ""}
    ${graticule}
    ${land}
    <rect x="${insetBox.x}" y="${insetBox.y}" width="${insetBox.width}" height="${insetBox.height}" rx="4" fill="${SEA}" stroke="#9FB2C0" stroke-dasharray="3 2" />
    <text x="${insetBox.x + 5}" y="${insetBox.y + 11}" font-size="${(8.6 * textUnit).toFixed(1)}" font-weight="650" fill="#4A5E6D">Okinawa (inset)</text>
    ${okinawaLand}
    <text x="${(width * 0.28).toFixed(1)}" y="${(height * 0.36).toFixed(1)}" font-size="${(10 * textUnit).toFixed(1)}" font-style="italic" fill="#7A8FA0">Sea of Japan</text>
    <text x="${(width * 0.64).toFixed(1)}" y="${(height * 0.8).toFixed(1)}" font-size="${(10 * textUnit).toFixed(1)}" font-style="italic" fill="#7A8FA0">Pacific Ocean</text>
    ${bubbles}
    ${labels}
    ${legendSvg}
  </svg>`;
}
