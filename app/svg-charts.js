// Pure inline SVG statistical visualization generators (zero external libraries).

import { escapeHtml } from "./export-utils.js";

export function renderSparklineSvg(values, stroke = "#1B4F72", width = 88, height = 26) {
  if (!values || values.length < 2) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pad = 4;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const pts = values.map((v, idx) => [
    pad + (idx / (values.length - 1)) * innerW,
    pad + innerH - ((v - min) / span) * innerH,
  ]);
  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  const areaD = `${pathD} L${last[0].toFixed(1)},${height - 2} L${pts[0][0].toFixed(1)},${height - 2} Z`;
  return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" aria-hidden="true">
    <path d="${areaD}" fill="${stroke}" fill-opacity="0.10" />
    <path d="${pathD}" fill="none" stroke="${stroke}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
    <circle cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="2.6" fill="${stroke}" />
  </svg>`;
}

export function renderMacroComboSvg(series, mode = "gdp", activeYear = 2024) {
  const width = 620;
  const height = 226;
  const pad = { top: 22, right: 44, bottom: 26, left: 46 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const stepX = plotW / series.length;
  const xCenter = (i) => pad.left + stepX * i + stepX / 2;

  if (mode === "trade") {
    const maxVal = 120;
    const yPos = (v) => pad.top + plotH - (v / maxVal) * plotH;
    const grid = [0, 30, 60, 90, 120].map((g) => {
      const y = yPos(g).toFixed(1);
      return `<line x1="${pad.left}" y1="${y}" x2="${width - pad.right}" y2="${y}" stroke="#E3DDD0" stroke-dasharray="3,3" />
        <text x="${pad.left - 6}" y="${Number(y) + 3.5}" text-anchor="end" font-size="10" fill="#556171">¥${g}T</text>`;
    }).join("");
    const bars = series.map((row, i) => {
      const cx = xCenter(i);
      const expH = (row.exportsT / maxVal) * plotH;
      const impH = (row.importsT / maxVal) * plotH;
      const hi = row.year === activeYear;
      return `<g>
        ${hi ? `<rect x="${(cx - stepX * 0.44).toFixed(1)}" y="${pad.top}" width="${(stepX * 0.88).toFixed(1)}" height="${plotH}" fill="#1B4F72" fill-opacity="0.07" rx="3" />` : ""}
        <rect x="${(cx - 11).toFixed(1)}" y="${(pad.top + plotH - expH).toFixed(1)}" width="10" height="${expH.toFixed(1)}" fill="#1B4F72" rx="2" />
        <rect x="${(cx + 1).toFixed(1)}" y="${(pad.top + plotH - impH).toFixed(1)}" width="10" height="${impH.toFixed(1)}" fill="#C43A27" fill-opacity="0.84" rx="2" />
        <text x="${cx.toFixed(1)}" y="${height - 8}" text-anchor="middle" font-size="10.5" font-weight="${hi ? "700" : "500"}" fill="${hi ? "#141920" : "#556171"}">${row.year}</text>
      </g>`;
    }).join("");
    return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Japan Merchandise Exports vs Imports 2015 to 2024">${grid}${bars}
      <g transform="translate(${pad.left}, 12)" font-size="10.5" fill="#2F3946">
        <rect x="0" y="-8" width="9" height="9" fill="#1B4F72" rx="2" /><text x="13" y="0">Exports (¥T)</text>
        <rect x="92" y="-8" width="9" height="9" fill="#C43A27" rx="2" /><text x="105" y="0">Imports (¥T, MOF Customs)</text>
      </g></svg>`;
  }

  if (mode === "prices") {
    const minY = -3.0;
    const maxY = 4.0;
    const yPos = (v) => pad.top + plotH - ((v - minY) / (maxY - minY)) * plotH;
    const zeroY = yPos(0);
    const grid = [-2, 0, 2, 4].map((g) => {
      const y = yPos(g).toFixed(1);
      return `<line x1="${pad.left}" y1="${y}" x2="${width - pad.right}" y2="${y}" stroke="${g === 0 ? "#9AA4B2" : "#E3DDD0"}" ${g === 2 ? 'stroke-dasharray="4,2"' : ""} />
        <text x="${pad.left - 6}" y="${Number(y) + 3.5}" text-anchor="end" font-size="10" fill="#556171">${g}%</text>`;
    }).join("");
    const cpiBars = series.map((row, i) => {
      const cx = xCenter(i);
      const yVal = yPos(row.coreCpiPct);
      const top = Math.min(yVal, zeroY);
      const barH = Math.max(2, Math.abs(zeroY - yVal));
      const hi = row.year === activeYear;
      return `<g>
        ${hi ? `<rect x="${(cx - stepX * 0.42).toFixed(1)}" y="${pad.top}" width="${(stepX * 0.84).toFixed(1)}" height="${plotH}" fill="#C43A27" fill-opacity="0.07" rx="3" />` : ""}
        <rect x="${(cx - 11).toFixed(1)}" y="${top.toFixed(1)}" width="22" height="${barH.toFixed(1)}" fill="${row.coreCpiPct >= 0 ? "#C43A27" : "#1B4F72"}" fill-opacity="0.85" rx="2" />
        <text x="${cx.toFixed(1)}" y="${height - 8}" text-anchor="middle" font-size="10.5" font-weight="${hi ? "700" : "500"}" fill="${hi ? "#141920" : "#556171"}">${row.year}</text>
      </g>`;
    }).join("");
    const wageLine = series.map((r, i) => `${i === 0 ? "M" : "L"}${xCenter(i).toFixed(1)},${yPos(r.realWageYoY).toFixed(1)}`).join(" ");
    const bojLine = series.map((r, i) => `${i === 0 ? "M" : "L"}${xCenter(i).toFixed(1)},${yPos(r.bojRatePct).toFixed(1)}`).join(" ");
    return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Core CPI, Real Wages, and BOJ Rate">${grid}${cpiBars}
      <path d="${bojLine}" fill="none" stroke="#1E6B52" stroke-width="2.1" stroke-dasharray="4,3" />
      <path d="${wageLine}" fill="none" stroke="#1B4F72" stroke-width="2.3" />
      ${series.map((r, i) => `<circle cx="${xCenter(i).toFixed(1)}" cy="${yPos(r.realWageYoY).toFixed(1)}" r="3" fill="#1B4F72" />`).join("")}
      <g transform="translate(${pad.left}, 12)" font-size="10.5" fill="#2F3946">
        <rect x="0" y="-8" width="9" height="9" fill="#C43A27" rx="2" /><text x="13" y="0">Core CPI YoY</text>
        <line x1="98" y1="-3.5" x2="114" y2="-3.5" stroke="#1B4F72" stroke-width="2.3" /><text x="118" y="0">Real Wage YoY</text>
        <line x1="214" y1="-3.5" x2="230" y2="-3.5" stroke="#1E6B52" stroke-width="2.1" stroke-dasharray="4,2" /><text x="234" y="0">BOJ Policy Rate</text>
      </g></svg>`;
  }

  const gdpMin = 500, gdpMax = 630, grMin = -5.5, grMax = 4.5;
  const yGdp = (v) => pad.top + plotH - ((v - gdpMin) / (gdpMax - gdpMin)) * plotH;
  const yGr = (v) => pad.top + plotH - ((v - grMin) / (grMax - grMin)) * plotH;
  const grid = [500, 530, 560, 590, 620].map((g) => {
    const y = yGdp(g).toFixed(1);
    return `<line x1="${pad.left}" y1="${y}" x2="${width - pad.right}" y2="${y}" stroke="#E3DDD0" stroke-dasharray="3,3" />
      <text x="${pad.left - 6}" y="${Number(y) + 3.5}" text-anchor="end" font-size="10" fill="#556171">¥${g}T</text>`;
  }).join("");
  const rightLabels = [-4, -2, 0, 2, 4].map((r) => `<text x="${width - pad.right + 6}" y="${(yGr(r) + 3.5).toFixed(1)}" font-size="10" fill="#C43A27">${r > 0 ? "+" : ""}${r}%</text>`).join("");
  const bars = series.map((row, i) => {
    const cx = xCenter(i);
    const top = yGdp(row.nominalGdpT);
    const lineY = yGr(row.realGrowthPct);
    const h = pad.top + plotH - top;
    const hi = row.year === activeYear;
    const defaultLabelY = top - 4.5;
    const insideBar = Math.abs(lineY - defaultLabelY) < 11 && lineY < top;
    const labelY = Math.abs(lineY - defaultLabelY) < 11 ? (insideBar ? top + 12.5 : Math.min(defaultLabelY, lineY - 9)) : defaultLabelY;
    return `<g>
      ${hi ? `<rect x="${(cx - stepX * 0.44).toFixed(1)}" y="${pad.top}" width="${(stepX * 0.88).toFixed(1)}" height="${plotH}" fill="#1B4F72" fill-opacity="0.08" rx="3" />` : ""}
      <rect x="${(cx - 12).toFixed(1)}" y="${top.toFixed(1)}" width="24" height="${h.toFixed(1)}" fill="${hi ? "#1B4F72" : "#3A6B8C"}" fill-opacity="${hi ? "0.95" : "0.78"}" rx="2.5" />
      <text x="${cx.toFixed(1)}" y="${labelY.toFixed(1)}" text-anchor="middle" font-size="9.2" font-weight="700" fill="${insideBar ? "#FFFFFF" : "#1B4F72"}" ${insideBar ? "" : 'paint-order="stroke" stroke="#FFFFFF" stroke-width="3"'}>${row.nominalGdpT.toFixed(0)}</text>
      <text x="${cx.toFixed(1)}" y="${height - 8}" text-anchor="middle" font-size="10.5" font-weight="${hi ? "700" : "500"}" fill="${hi ? "#141920" : "#556171"}">${row.year}</text>
    </g>`;
  }).join("");
  const lineD = series.map((r, i) => `${i === 0 ? "M" : "L"}${xCenter(i).toFixed(1)},${yGr(r.realGrowthPct).toFixed(1)}`).join(" ");
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Japan Nominal GDP and Real GDP Growth 2015 to 2024">
    ${grid}${rightLabels}${bars}
    <path d="${lineD}" fill="none" stroke="#C43A27" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
    ${series.map((r, i) => `<circle cx="${xCenter(i).toFixed(1)}" cy="${yGr(r.realGrowthPct).toFixed(1)}" r="${r.year === activeYear ? "4.3" : "3"}" fill="#C43A27" stroke="#fff" stroke-width="1.2" />`).join("")}
    <g transform="translate(${pad.left}, 12)" font-size="10.5" fill="#2F3946">
      <rect x="0" y="-8" width="9" height="9" fill="#1B4F72" rx="2" /><text x="13" y="0">Nominal GDP (¥ Trillion, left)</text>
      <line x1="184" y1="-3.5" x2="202" y2="-3.5" stroke="#C43A27" stroke-width="2.4" /><circle cx="193" cy="-3.5" r="3" fill="#C43A27" /><text x="207" y="0">Real GDP YoY % (right, 2015 chain)</text>
    </g></svg>`;
}

export function renderJapanChoroplethSvg(prefectures, metricMeta, selectedCode, compareCodes = []) {
  const width = 612, height = 406, cell = 27.2, offX = 8, offY = 8;
  const colorFor = (val) => {
    for (let i = 0; i < metricMeta.bins.length; i += 1) {
      if (val <= metricMeta.bins[i]) return metricMeta.palette[i];
    }
    return metricMeta.palette[metricMeta.palette.length - 1];
  };
  const fgFor = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return 0.299 * r + 0.587 * g + 0.114 * b < 142 ? "#FFFFFF" : "#141920";
  };
  const compareSet = new Set(compareCodes);
  const rects = prefectures.map((p) => {
    const x = offX + p.gx * cell, y = offY + p.gy * cell;
    const w = p.gw * cell - 2.2, h = p.gh * cell - 2.2;
    const val = p[metricMeta.key];
    const fill = colorFor(val), fg = fgFor(fill);
    const isSel = p.code === selectedCode, isCmp = compareSet.has(p.code);
    return `<g class="pref-cell" data-pref-code="${p.code}">
      <title>${escapeHtml(p.name)} (${escapeHtml(p.region)}): ${metricMeta.format(val)}</title>
      <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="3.5" fill="${fill}" stroke="${isSel ? "#C43A27" : isCmp ? "#141920" : "#FFFFFF"}" stroke-width="${isSel ? "2.6" : isCmp ? "1.8" : "0.9"}" />
      <text x="${(x + w / 2).toFixed(1)}" y="${(y + h / 2 - 1.5).toFixed(1)}" text-anchor="middle" font-size="8.5" font-weight="700" fill="${fg}">${p.short}</text>
      <text x="${(x + w / 2).toFixed(1)}" y="${(y + h / 2 + 8).toFixed(1)}" text-anchor="middle" font-size="7.5" fill="${fg}" fill-opacity="0.92">${metricMeta.shortFormat(val)}</text>
    </g>`;
  }).join("");
  const legendItems = metricMeta.palette.map((col, idx) => `<g transform="translate(${18 + idx * 72}, 32)">
    <rect x="0" y="0" width="66" height="10" rx="2" fill="${col}" stroke="#C9C1B0" stroke-width="0.6" />
    <text x="33" y="21" text-anchor="middle" font-size="8.8" fill="#2F3946">${escapeHtml(metricMeta.binLabels[idx])}</text>
  </g>`).join("");
  const oknX = offX + 1.2 * cell - 5, oknY = offY + 12.8 * cell - 14;
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="47-Prefecture Choropleth Atlas of Japan">
    <rect x="0" y="0" width="${width}" height="${height}" rx="8" fill="#EAF0F4" />
    <path d="M0 110 H${width} M0 220 H${width} M0 330 H${width} M150 0 V${height} M320 0 V${height} M490 0 V${height}" stroke="#DCE5EC" stroke-width="0.8" />
    <text x="18" y="22" font-size="11" font-weight="700" fill="#141920">${escapeHtml(metricMeta.label)} · All 47 Prefectures</text>
    ${legendItems}
    <text x="188" y="164" font-size="10" font-style="italic" fill="#607588">Sea of Japan (Nihonkai)</text>
    <text x="455" y="348" font-size="10" font-style="italic" fill="#607588">Pacific Ocean</text>
    <text x="168" y="309" font-size="7.6" font-style="italic" fill="#607588">Seto Inland Sea</text>
    <rect x="${oknX.toFixed(1)}" y="${oknY.toFixed(1)}" width="66" height="46" rx="4" fill="#E1EAF0" stroke="#8FA5B5" stroke-dasharray="3,2" />
    <text x="${(oknX + 4).toFixed(1)}" y="${(oknY + 10).toFixed(1)}" font-size="7.8" font-weight="600" fill="#4A5E6D">Ryukyu Inset</text>
    ${rects}</svg>`;
}

export function renderPopulationPyramidSvg(cohorts, baselineCohorts, selectedIdx = 15) {
  const width = 560, height = 340, top = 26, rowH = 16.1, centerL = 252, centerR = 308, maxPop = 5.6, halfW = 224;
  const xMale = (v) => centerL - (v / maxPop) * halfW;
  const xFemale = (v) => centerR + (v / maxPop) * halfW;
  const ticks = [0, 1, 2, 3, 4, 5].map((t) => {
    const xm = xMale(t).toFixed(1), xf = xFemale(t).toFixed(1);
    return `<line x1="${xm}" y1="${top}" x2="${xm}" y2="${top + cohorts.length * rowH}" stroke="#E6E0D3" stroke-dasharray="2,2" />
      <line x1="${xf}" y1="${top}" x2="${xf}" y2="${top + cohorts.length * rowH}" stroke="#E6E0D3" stroke-dasharray="2,2" />
      <text x="${xm}" y="${height - 6}" text-anchor="middle" font-size="9.5" fill="#556171">${t}M</text>
      <text x="${xf}" y="${height - 6}" text-anchor="middle" font-size="9.5" fill="#556171">${t}M</text>`;
  }).join("");
  const rows = cohorts.map((_, idx) => {
    const revIdx = cohorts.length - 1 - idx;
    const item = cohorts[revIdx];
    const y = top + idx * rowH;
    const mw = (item.male / maxPop) * halfW, fw = (item.female / maxPop) * halfW;
    const isSel = revIdx === selectedIdx;
    return `<g class="pyramid-row" data-cohort-idx="${revIdx}" style="cursor:pointer">
      ${isSel ? `<rect x="8" y="${(y - 0.5).toFixed(1)}" width="${width - 16}" height="${(rowH - 1).toFixed(1)}" fill="#FAEFDC" rx="2" />` : ""}
      <rect x="${(centerL - mw).toFixed(1)}" y="${(y + 1.5).toFixed(1)}" width="${mw.toFixed(1)}" height="${(rowH - 3.2).toFixed(1)}" fill="${isSel ? "#123852" : "#1B4F72"}" rx="1.5" />
      <rect x="${centerR}" y="${(y + 1.5).toFixed(1)}" width="${fw.toFixed(1)}" height="${(rowH - 3.2).toFixed(1)}" fill="${isSel ? "#9E2A1B" : "#C43A27"}" fill-opacity="0.88" rx="1.5" />
      <text x="280" y="${(y + 11.4).toFixed(1)}" text-anchor="middle" font-size="9.5" font-weight="${isSel ? "700" : "600"}" fill="#141920">${item.age}</text>
    </g>`;
  }).join("");
  let overlay = "";
  if (baselineCohorts && baselineCohorts.length === cohorts.length) {
    const mPts = cohorts.map((_, i) => `${i === 0 ? "M" : "L"}${xMale(baselineCohorts[cohorts.length - 1 - i].male).toFixed(1)},${(top + i * rowH + rowH / 2).toFixed(1)}`).join(" ");
    const fPts = cohorts.map((_, i) => `${i === 0 ? "M" : "L"}${xFemale(baselineCohorts[cohorts.length - 1 - i].female).toFixed(1)},${(top + i * rowH + rowH / 2).toFixed(1)}`).join(" ");
    overlay = `<path d="${mPts}" fill="none" stroke="#A86814" stroke-width="1.8" stroke-dasharray="4,2" /><path d="${fPts}" fill="none" stroke="#A86814" stroke-width="1.8" stroke-dasharray="4,2" />`;
  }
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Age-sex population pyramid of Japan">
    <text x="${centerL - 8}" y="16" text-anchor="end" font-size="11" font-weight="700" fill="#1B4F72">← Male (Millions)</text>
    <text x="280" y="16" text-anchor="middle" font-size="10" font-weight="700" fill="#556171">Age</text>
    <text x="${centerR + 8}" y="16" text-anchor="start" font-size="11" font-weight="700" fill="#C43A27">Female (Millions) →</text>
    ${ticks}${rows}${overlay}</svg>`;
}

export function renderVitalLinesSvg(vitalSeries) {
  const width = 460, height = 158, pad = { top: 20, right: 16, bottom: 22, left: 42 };
  const plotW = width - pad.left - pad.right, plotH = height - pad.top - pad.bottom;
  const xPos = (i) => pad.left + (i / (vitalSeries.length - 1)) * plotW;
  const yPos = (v) => pad.top + plotH - ((v - 600) / 1100) * plotH;
  const bPath = vitalSeries.map((d, i) => `${i === 0 ? "M" : "L"}${xPos(i).toFixed(1)},${yPos(d.birthsK).toFixed(1)}`).join(" ");
  const dPath = vitalSeries.map((d, i) => `${i === 0 ? "M" : "L"}${xPos(i).toFixed(1)},${yPos(d.deathsK).toFixed(1)}`).join(" ");
  const grid = [700, 1000, 1300, 1600].map((g) => `<line x1="${pad.left}" y1="${yPos(g).toFixed(1)}" x2="${width - pad.right}" y2="${yPos(g).toFixed(1)}" stroke="#E6E0D3" stroke-dasharray="3,3" /><text x="${pad.left - 5}" y="${(yPos(g) + 3.5).toFixed(1)}" text-anchor="end" font-size="9.5" fill="#556171">${(g / 1000).toFixed(1)}M</text>`).join("");
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Japan Live Births vs Deaths 1990 to 2024">${grid}
    <path d="${bPath}" fill="none" stroke="#1E6B52" stroke-width="2.3" /><path d="${dPath}" fill="none" stroke="#C43A27" stroke-width="2.3" />
    ${vitalSeries.map((d, i) => `<circle cx="${xPos(i).toFixed(1)}" cy="${yPos(d.birthsK).toFixed(1)}" r="2.5" fill="#1E6B52" /><circle cx="${xPos(i).toFixed(1)}" cy="${yPos(d.deathsK).toFixed(1)}" r="2.5" fill="#C43A27" />${i % 2 === 0 || i === vitalSeries.length - 1 ? `<text x="${xPos(i).toFixed(1)}" y="${height - 5}" text-anchor="middle" font-size="9.2" fill="#556171">${d.year}</text>` : ""}`).join("")}
    <g transform="translate(${pad.left}, 12)" font-size="10" fill="#2F3946">
      <line x1="0" y1="-3" x2="14" y2="-3" stroke="#1E6B52" stroke-width="2.3" /><text x="18" y="0">Live Births (686k)</text>
      <line x1="138" y1="-3" x2="152" y2="-3" stroke="#C43A27" stroke-width="2.3" /><text x="156" y="0">Deaths (1,605k, MHLW)</text>
    </g></svg>`;
}

export function renderHorizontalBarsSvg(items, maxValue = 1.2) {
  const width = 460, rowH = 24, height = items.length * rowH + 8, labelW = 144, barArea = width - labelW - 68;
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Category breakdown chart">${items.map((item, i) => {
    const y = 4 + i * rowH, w = Math.max(3, (Math.abs(item.value) / maxValue) * barArea);
    return `<g><text x="${labelW - 8}" y="${y + 14}" text-anchor="end" font-size="10.6" font-weight="600" fill="#141920">${escapeHtml(item.label)}</text>
      <rect x="${labelW}" y="${y + 3}" width="${barArea}" height="13.5" rx="3" fill="#EFECE3" />
      <rect x="${labelW}" y="${y + 3}" width="${w.toFixed(1)}" height="13.5" rx="3" fill="${item.color ?? "#C43A27"}" />
      <text x="${labelW + barArea + 6}" y="${y + 14}" font-size="10.2" font-family="monospace" font-weight="700" fill="#141920">${escapeHtml(item.display)}</text></g>`;
  }).join("")}</svg>`;
}

export function renderStackedMixBarSvg(segments) {
  const width = 460;
  let cursor = 0;
  const rects = segments.map((s) => {
    const w = (s.share / 100) * width, x = cursor;
    cursor += w;
    return `<g><title>${escapeHtml(s.label)}: ${s.share}%</title><rect x="${x.toFixed(1)}" y="4" width="${Math.max(1, w - 1.2).toFixed(1)}" height="22" fill="${s.color}" rx="2" />${w > 36 ? `<text x="${(x + w / 2).toFixed(1)}" y="18.5" text-anchor="middle" font-size="9.5" font-weight="700" fill="#fff">${s.share}%</text>` : ""}</g>`;
  }).join("");
  const legend = segments.map((s, idx) => `<g transform="translate(${(idx % 4) * 114}, ${38 + Math.floor(idx / 4) * 14})"><rect x="0" y="-7" width="8" height="8" rx="1.5" fill="${s.color}" /><text x="11" y="0" font-size="9.2" fill="#2F3946">${escapeHtml(s.short)} ${s.share}%</text></g>`).join("");
  return `<svg viewBox="0 0 ${width} 68" role="img" aria-label="FY2024 Electricity Generation Mix">${rects}${legend}</svg>`;
}