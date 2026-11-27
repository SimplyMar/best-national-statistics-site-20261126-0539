// Formatting, safe HTML escaping, and client-side CSV/JSON/citation export helpers.

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function formatSigned(value, decimals = 1, suffix = "%") {
  const num = Number(value);
  const sign = num > 0 ? "+" : "";
  return `${sign}${num.toFixed(decimals)}${suffix}`;
}

export function formatYen(amount) {
  return `¥${Math.round(Number(amount)).toLocaleString("en-US")}`;
}

export function showToast(message) {
  const region = document.getElementById("toast-region");
  if (!region) return;
  const item = document.createElement("div");
  item.className = "toast-msg";
  item.textContent = message;
  region.appendChild(item);
  setTimeout(() => {
    item.remove();
  }, 2600);
}

export function downloadCsvFile(filename, headers, rows) {
  const quoteCell = (cell) => {
    const raw = String(cell ?? "");
    return /[",\n]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
  };
  const lines = [
    headers.map(quoteCell).join(","),
    ...rows.map((row) => row.map(quoteCell).join(",")),
  ];
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  triggerBlobDownload(filename, blob);
  showToast(`Exported ${filename} (${rows.length} rows)`);
}

export function downloadJsonFile(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
  triggerBlobDownload(filename, blob);
  showToast(`Exported ${filename}`);
}

function triggerBlobDownload(filename, blob) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

export async function copyCitationText(text, label = "Official citation") {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    }
    showToast(`${label} copied to clipboard`);
  } catch {
    showToast(`${label}: ${text.slice(0, 64)}…`);
  }
}