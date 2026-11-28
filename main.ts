// Retto Almanac hand-in program for make.fun's national statistics site bounty (Node 22, standard
// library only). It copies the static site (app/) and its screenshots (screenshots/) into the
// grader's output folder and writes dossier.json with the kit's unchanged frontend library.
// Locally, MAKEFUN_OUTPUT_DIR stands in for /output:  MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const REPOSITORY = dirname(fileURLToPath(import.meta.url));
const OUTPUT = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? "/output");

/** The scorer's caps, so a bad hand-in fails here with a clear message instead of at the gate. */
const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 16777216,
} as const;
const DOSSIER_CAP_BYTES = 1.5 * 1024 * 1024;
const SCREENSHOT_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;

/** Copy app/ whole; the site must have its index page. */
function copySite(): void {
  const site = join(REPOSITORY, "app");
  if (!existsSync(join(site, "index.html"))) throw new Error("app/index.html is missing: nothing to hand in.");
  cpSync(site, join(OUTPUT, "app"), { recursive: true });
}

/** Copy 3 or 4 screenshots in name order (the first is the cover), checking name and size. */
function copyScreenshots(): string[] {
  const folder = join(REPOSITORY, "screenshots");
  const names = existsSync(folder) ? readdirSync(folder).filter((name) => !name.startsWith(".")).sort() : [];
  if (names.length < 3 || names.length > CAPS.screenshots.max) throw new Error(`screenshots/ holds ${names.length} images; the gate wants 3 or 4.`);
  const target = join(OUTPUT, "screenshots");
  mkdirSync(target, { recursive: true });
  for (const name of names) {
    const bytes = statSync(join(folder, name)).size;
    if (!SCREENSHOT_NAME.test(name)) throw new Error(`Screenshot name ${name} has characters the gate refuses.`);
    if (bytes === 0 || bytes > CAPS.screenshots.max_bytes) throw new Error(`Screenshot ${name} is ${bytes} bytes; the cap is 256 KiB.`);
    copyFileSync(join(folder, name), join(target, name));
  }
  return names;
}

mkdirSync(OUTPUT, { recursive: true });
copySite();
copyScreenshots();
const dossier = buildDossier(OUTPUT, CAPS);
if (dossier.byteLength > DOSSIER_CAP_BYTES) throw new Error(`dossier.json is ${dossier.byteLength} bytes; the cap is 1.5 MiB.`);
writeFileSync(join(OUTPUT, "dossier.json"), dossier);
