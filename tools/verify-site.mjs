// Browser check and screenshot maker for Retto Almanac, using only Node and an installed Chrome.
// It serves app/ with serve.ts, drives headless Chrome over the DevTools protocol, and:
//   1. renders each scene in shots.json and saves it as a JPEG under 256 KiB in screenshots/;
//   2. opens every route at desktop and phone width and fails on sideways overflow or an empty page;
//   3. clicks the filters and the calculator and checks they change what they say they change;
//   4. fails on any page error or any request that leaves the local server.
//   node tools/verify-site.mjs
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SITE_PORT = 8192;
const DEBUG_PORT = 9392;
const CHROME = process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const SHOT_BUDGET = 242000;
const ROUTES = ["#/", "#/regions", "#/demographics", "#/economy", "#/society", "#/catalog", "#/sources", "#/glossary"];
const VIEWPORTS = { desktop: { width: 1280, height: 800, mobile: false }, phone: { width: 390, height: 844, mobile: true } };
const wait = (ms) => new Promise((done) => setTimeout(done, ms));

/** Start the static server and Chrome; resolve with Chrome's page socket URL. */
async function launch() {
  const profile = join(ROOT, ".tmp", "chrome-verify");
  rmSync(profile, { recursive: true, force: true });
  mkdirSync(profile, { recursive: true });
  const server = spawn(process.execPath, [join(ROOT, "serve.ts"), "--port", String(SITE_PORT)], { stdio: "ignore" });
  const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${DEBUG_PORT}`, `--user-data-dir=${profile}`, "--hide-scrollbars", "--no-first-run", "--no-default-browser-check", "about:blank"], { stdio: "ignore" });
  for (let attempt = 0; attempt < 75; attempt += 1) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`)).json();
      const page = targets.find((target) => target.type === "page");
      if (page) return { server, chrome, socketUrl: page.webSocketDebuggerUrl };
    } catch {
      // Chrome is still starting.
    }
    await wait(200);
  }
  server.kill();
  chrome.kill();
  throw new Error("Chrome never opened its debugging port");
}

/** A tiny DevTools client that also records page errors and off-site requests. */
async function connect(socketUrl) {
  const socket = new WebSocket(socketUrl);
  await new Promise((done) => socket.addEventListener("open", done, { once: true }));
  const waiting = new Map();
  const pageErrors = [];
  const offsite = [];
  let nextId = 1;
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data);
    if (message.id && waiting.has(message.id)) {
      waiting.get(message.id)(message);
      waiting.delete(message.id);
    } else if (message.method === "Runtime.exceptionThrown") {
      pageErrors.push(message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text);
    } else if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") {
      pageErrors.push(message.params.args.map((arg) => arg.value ?? arg.description).join(" "));
    } else if (message.method === "Network.requestWillBeSent") {
      const url = message.params.request.url;
      if (!/^(http:\/\/127\.0\.0\.1:\d+|data:|blob:|about:blank)/.test(url)) offsite.push(url);
    }
  });
  const send = (method, params = {}) =>
    new Promise((done) => {
      const id = nextId++;
      waiting.set(id, done);
      socket.send(JSON.stringify({ id, method, params }));
    });
  const run = async (expression) => {
    const reply = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (reply.result?.exceptionDetails) throw new Error(`In page: ${expression}\n${reply.result.exceptionDetails.exception?.description ?? "failed"}`);
    return reply.result?.result?.value;
  };
  await send("Runtime.enable");
  await send("Page.enable");
  await send("Network.enable");
  return { socket, send, run, pageErrors, offsite };
}

/** Open a route at a viewport and wait until the app says the view is drawn. */
async function open(page, route, viewport) {
  await page.send("Emulation.setDeviceMetricsOverride", { width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: viewport.mobile });
  await page.send("Page.navigate", { url: `http://127.0.0.1:${SITE_PORT}/index.html${route}` });
  await settle(page);
}

async function settle(page) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if ((await page.run("window.__shotReady === true")) === true) return;
    await wait(100);
  }
  throw new Error("The view never signalled __shotReady");
}

/** Capture a JPEG, lowering quality until it fits the gate's size budget. */
async function captureJpeg(page, startQuality) {
  let quality = startQuality;
  let bytes;
  do {
    bytes = Buffer.from((await page.send("Page.captureScreenshot", { format: "jpeg", quality })).result.data, "base64");
    quality -= 6;
  } while (bytes.byteLength > SHOT_BUDGET && quality > 50);
  return { bytes, quality: quality + 6 };
}

/** Click something, wait for the redraw, and return a count from the page. */
async function clickAndCount(page, selector, countExpression) {
  await page.run(`document.querySelector(${JSON.stringify(selector)}).click()`);
  await settle(page);
  return page.run(countExpression);
}

const { server, chrome, socketUrl } = await launch();
const page = await connect(socketUrl);
try {
  mkdirSync(join(ROOT, "screenshots"), { recursive: true });
  for (const scene of JSON.parse(readFileSync(join(ROOT, "shots.json"), "utf8"))) {
    await open(page, scene.path, scene.viewport.width < 600 ? { ...VIEWPORTS.phone, ...scene.viewport } : { ...VIEWPORTS.desktop, ...scene.viewport });
    await wait(200);
    const { bytes, quality } = await captureJpeg(page, scene.mobile ? 82 : 88);
    writeFileSync(join(ROOT, "screenshots", scene.file), bytes);
    console.log(`SHOT ${scene.file}: ${bytes.byteLength} bytes (q=${quality})`);
  }

  for (const [name, viewport] of Object.entries(VIEWPORTS)) {
    for (const route of ROUTES) {
      await open(page, route, viewport);
      const overflow = await page.run("document.documentElement.scrollWidth - window.innerWidth");
      if (overflow > 1) throw new Error(`${route} overflows sideways by ${overflow}px on ${name}`);
      const textLength = await page.run("document.getElementById('view-root').innerText.length");
      if (textLength < 400) throw new Error(`${route} shows only ${textLength} characters on ${name}`);
    }
  }

  await open(page, "#/society", VIEWPORTS.desktop);
  const allFacts = await page.run("document.querySelectorAll('.fact-card').length");
  const healthFacts = await clickAndCount(page, '[data-society-theme="health"]', "document.querySelectorAll('.fact-card').length");
  if (!(healthFacts > 0 && healthFacts < allFacts)) throw new Error(`Society theme filter: ${allFacts} -> ${healthFacts}`);

  await open(page, "#/sources", VIEWPORTS.desktop);
  const allRows = await page.run("document.querySelectorAll('.finder-table tbody tr').length");
  const mhlwRows = await clickAndCount(page, '[data-agency="MHLW"]', "document.querySelectorAll('.finder-table tbody tr').length");
  if (!(mhlwRows > 0 && mhlwRows < allRows)) throw new Error(`Sources agency filter: ${allRows} -> ${mhlwRows}`);

  await open(page, "#/glossary", VIEWPORTS.desktop);
  const allTerms = await page.run("document.querySelectorAll('.term-card').length");
  const priceTerms = await clickAndCount(page, '[data-glossary-topic="Prices"]', "document.querySelectorAll('.term-card').length");
  if (!(priceTerms > 0 && priceTerms < allTerms)) throw new Error(`Glossary topic tabs: ${allTerms} -> ${priceTerms}`);

  await open(page, "#/", VIEWPORTS.desktop);
  await clickAndCount(page, '[data-yen-preset="330000"]', "1");
  const converted = await page.run("document.querySelector('.calc-big')?.textContent ?? ''");
  if (!converted.startsWith("¥")) throw new Error(`CPI converter shows "${converted}"`);
  await clickAndCount(page, "#reset-state-btn", "1");

  if (page.pageErrors.length) throw new Error(`Page errors: ${page.pageErrors.join(" | ")}`);
  if (page.offsite.length) throw new Error(`Requests left the local server: ${page.offsite.join(", ")}`);
  console.log(`FILTERS OK · society ${allFacts} -> ${healthFacts} · sources ${allRows} -> ${mhlwRows} · glossary ${allTerms} -> ${priceTerms}`);
  console.log(`VERIFICATION OK · ${ROUTES.length} routes × 2 widths · converter ${converted}`);
} finally {
  page.socket.close();
  chrome.kill();
  server.kill();
  await wait(400);
}
