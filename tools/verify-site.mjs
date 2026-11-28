// Automated headless Chrome verification & screenshot renderer for Retto Almanac (zero npm packages).
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL("..", import.meta.url));
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const appPort = 8192;
const cdpPort = 9392;
const chromeBin = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const userDataDir = join(rootDir, ".tmp", `chrome-${cdpPort}`);

rmSync(userDataDir, { recursive: true, force: true });
mkdirSync(userDataDir, { recursive: true });
mkdirSync(join(rootDir, "screenshots"), { recursive: true });

const httpProc = spawn(process.execPath, [join(rootDir, "serve.ts"), "--port", String(appPort)], { stdio: "ignore" });
const chromeProc = spawn(chromeBin, [
  "--headless=new",
  `--remote-debugging-port=${cdpPort}`,
  `--user-data-dir=${userDataDir}`,
  "--window-size=1280,800",
  "--hide-scrollbars",
  "--no-first-run",
  "--no-default-browser-check",
  "about:blank",
], { stdio: "ignore" });

let wsEndpoint = null;
for (let i = 0; i < 60 && !wsEndpoint; i += 1) {
  try {
    const pages = await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json();
    wsEndpoint = pages.find((p) => p.type === "page")?.webSocketDebuggerUrl ?? null;
  } catch {
    // Wait for Chrome DevTools endpoint.
  }
  if (!wsEndpoint) await delay(200);
}

if (!wsEndpoint) {
  chromeProc.kill();
  httpProc.kill();
  throw new Error("Failed to connect to headless Chrome CDP port");
}

const ws = new WebSocket(wsEndpoint);
await new Promise((resolve) => ws.addEventListener("open", resolve, { once: true }));

let seq = 1;
const inflight = new Map();
const runtimeErrors = [];
const blockedRequests = [];

ws.addEventListener("message", (event) => {
  const payload = JSON.parse(event.data);
  if (payload.id && inflight.has(payload.id)) {
    inflight.get(payload.id)(payload);
    inflight.delete(payload.id);
  } else if (payload.method === "Runtime.exceptionThrown") {
    runtimeErrors.push(payload.params.exceptionDetails.text || "uncaught exception");
  } else if (payload.method === "Runtime.consoleAPICalled" && payload.params.type === "error") {
    runtimeErrors.push(payload.params.args.map((a) => a.value ?? a.description).join(" "));
  } else if (payload.method === "Network.requestWillBeSent") {
    const reqUrl = payload.params.request.url;
    if (!reqUrl.startsWith(`http://127.0.0.1:${appPort}`) && !reqUrl.startsWith("data:") && !reqUrl.startsWith("blob:") && reqUrl !== "about:blank") {
      blockedRequests.push(reqUrl);
    }
  }
});

const cdp = (method, params = {}) =>
  new Promise((resolve) => {
    const id = seq++;
    inflight.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });

const evalInPage = async (expression) => {
  const res = await cdp("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (res.result?.exceptionDetails) {
    throw new Error(res.result.exceptionDetails.exception?.description ?? "Page evaluation failed");
  }
  return res.result?.result?.value;
};

const awaitShotReady = async () => {
  for (let i = 0; i < 80; i += 1) {
    if ((await evalInPage("window.__shotReady === true")) === true) return;
    await delay(100);
  }
  throw new Error("Timed out waiting for window.__shotReady");
};

try {
  await cdp("Runtime.enable");
  await cdp("Page.enable");
  await cdp("Network.enable");

  const shotSpecs = JSON.parse(readFileSync(join(rootDir, "shots.json"), "utf8"));
  for (const spec of shotSpecs) {
    await cdp("Emulation.setDeviceMetricsOverride", {
      width: spec.viewport.width,
      height: spec.viewport.height,
      deviceScaleFactor: 1,
      mobile: Boolean(spec.mobile),
    });
    await cdp("Page.navigate", { url: `http://127.0.0.1:${appPort}/index.html${spec.path}` });
    await awaitShotReady();
    await delay(180);

    const hOverflow = await evalInPage("document.documentElement.scrollWidth - window.innerWidth");
    if (hOverflow > 1) {
      throw new Error(`Horizontal overflow (${hOverflow}px) on ${spec.file}`);
    }

    let jpegQuality = spec.mobile ? 82 : 88;
    let imgBuf = Buffer.from((await cdp("Page.captureScreenshot", { format: "jpeg", quality: jpegQuality })).result.data, "base64");
    while (imgBuf.byteLength > 242000 && jpegQuality > 54) {
      jpegQuality -= 8;
      imgBuf = Buffer.from((await cdp("Page.captureScreenshot", { format: "jpeg", quality: jpegQuality })).result.data, "base64");
    }

    const outPath = join(rootDir, "screenshots", spec.file);
    writeFileSync(outPath, imgBuf);
    console.log(`SHOT ${spec.file}: ${statSync(outPath).size} bytes (q=${jpegQuality})`);
  }

  // Every route on desktop and phone: no horizontal overflow, and the page renders content.
  const allRoutes = ["#/", "#/regions", "#/demographics", "#/economy", "#/society", "#/catalog", "#/sources", "#/glossary"];
  for (const vp of [{ width: 1280, height: 800, mobile: false }, { width: 390, height: 844, mobile: true }]) {
    await cdp("Emulation.setDeviceMetricsOverride", { ...vp, deviceScaleFactor: 1 });
    for (const route of allRoutes) {
      await cdp("Page.navigate", { url: `http://127.0.0.1:${appPort}/index.html${route}` });
      await awaitShotReady();
      const ov = await evalInPage("document.documentElement.scrollWidth - window.innerWidth");
      if (ov > 1) throw new Error(`Overflow (${ov}px) on ${route} at width ${vp.width}`);
      const textLength = await evalInPage("document.getElementById('view-root').innerText.length");
      if (textLength < 400) throw new Error(`Route ${route} rendered only ${textLength} characters at width ${vp.width}`);
    }
  }

  // Society & Living theme chips and the Sources figure finder must filter what they say.
  await cdp("Emulation.setDeviceMetricsOverride", { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
  await cdp("Page.navigate", { url: `http://127.0.0.1:${appPort}/index.html#/society` });
  await awaitShotReady();
  const allCards = await evalInPage("document.querySelectorAll('.fact-card').length");
  await evalInPage("document.querySelector('[data-society-theme=\"health\"]').click()");
  await awaitShotReady();
  const healthCards = await evalInPage("document.querySelectorAll('.fact-card').length");
  if (!(healthCards > 0 && healthCards < allCards)) throw new Error(`Theme filter did not filter: ${allCards} -> ${healthCards}`);
  await cdp("Page.navigate", { url: `http://127.0.0.1:${appPort}/index.html#/sources` });
  await awaitShotReady();
  const allRows = await evalInPage("document.querySelectorAll('.finder-table tbody tr').length");
  await evalInPage("document.querySelector('[data-agency=\"MHLW\"]').click()");
  await awaitShotReady();
  const mhlwRows = await evalInPage("document.querySelectorAll('.finder-table tbody tr').length");
  if (!(mhlwRows > 0 && mhlwRows < allRows)) throw new Error(`Agency filter did not filter: ${allRows} -> ${mhlwRows}`);
  await evalInPage("document.getElementById('reset-state-btn').click()");
  await awaitShotReady();
  console.log(`FILTERS OK · society ${allCards} -> ${healthCards} · sources ${allRows} -> ${mhlwRows}`);

  // Interactive mutations test
  await cdp("Emulation.setDeviceMetricsOverride", { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
  await cdp("Page.navigate", { url: `http://127.0.0.1:${appPort}/index.html#/` });
  await awaitShotReady();
  await evalInPage("document.querySelector('[data-yen-preset=\"330000\"]').click()");
  await awaitShotReady();
  const calcOut = await evalInPage("document.querySelector('.calc-big')?.textContent");
  await evalInPage("document.getElementById('reset-state-btn').click()");
  await awaitShotReady();

  if (!calcOut || !calcOut.startsWith("¥")) throw new Error(`Unexpected calculator output: ${calcOut}`);
  if (runtimeErrors.length > 0) throw new Error(`Runtime errors: ${runtimeErrors.join(" | ")}`);
  if (blockedRequests.length > 0) throw new Error(`External requests: ${blockedRequests.join(", ")}`);
  console.log("VERIFICATION OK · calcOut =", calcOut);
} finally {
  ws.close();
  chromeProc.kill();
  httpProc.kill();
  await delay(400);
}