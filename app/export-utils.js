// Shared helpers for every page: HTML escaping, number formatting, toasts, and the CSV / JSON /
// citation exports. Exported files carry a header line naming the almanac and the export date.

const HTML_ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/** Make any value safe to place inside HTML text or a quoted attribute. */
export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);
}

/** A number with an explicit sign and a suffix: 2.5 -> "+2.5%", -0.44 -> "-0.4%". */
export function formatSigned(value, decimals = 1, suffix = "%") {
  const number = Number(value);
  if (!Number.isFinite(number)) return "–";
  return `${number > 0 ? "+" : ""}${number.toFixed(decimals)}${suffix}`;
}

/** A yen amount rounded to the yen with thousands separators: 1104888 -> "¥1,104,888". */
export function formatYen(amount) {
  const number = Math.round(Number(amount));
  return Number.isFinite(number) ? `¥${number.toLocaleString("en-US")}` : "¥–";
}

/** Show a short message in the corner for a few seconds (also read out by screen readers). */
export function showToast(message, seconds = 2.6) {
  const region = document.getElementById("toast-region");
  if (!region) return;
  const toast = document.createElement("div");
  toast.className = "toast-msg";
  toast.textContent = message;
  region.append(toast);
  window.setTimeout(() => toast.remove(), seconds * 1000);
}

/** Quote one CSV cell when it holds a comma, a quote or a line break. */
function csvCell(cell) {
  const text = String(cell ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/** Offer a file to the browser's downloads without any network request. */
function saveBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

const exportStamp = () => new Date().toISOString().slice(0, 10);

/** Download rows as a UTF-8 CSV (with BOM so Excel reads yen signs), headed by a provenance line. */
export function downloadCsvFile(filename, headers, rows) {
  const provenance = `# Retto Almanac export ${exportStamp()} · figures from official Japanese statistical releases`;
  const lines = [provenance, headers.map(csvCell).join(","), ...rows.map((row) => row.map(csvCell).join(","))];
  saveBlob(filename, new Blob([`﻿${lines.join("\r\n")}\r\n`], { type: "text/csv;charset=utf-8" }));
  showToast(`Exported ${filename} (${rows.length} rows)`);
}

/** Download any data as pretty-printed JSON, wrapped with the export date. */
export function downloadJsonFile(filename, payload) {
  const document_ = { exported: exportStamp(), publisher: "Retto Almanac", ...payload };
  saveBlob(filename, new Blob([JSON.stringify(document_, null, 2)], { type: "application/json;charset=utf-8" }));
  showToast(`Exported ${filename}`);
}

/** Copy a citation to the clipboard; where the clipboard is blocked, show the citation instead. */
export async function copyCitationText(text, label = "Citation") {
  try {
    await navigator.clipboard.writeText(text);
    showToast(`${label} copied to the clipboard`);
  } catch {
    showToast(`${label}: ${text.length > 70 ? `${text.slice(0, 70)}…` : text}`, 5);
  }
}
