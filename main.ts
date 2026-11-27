// Retto Almanac — Entrypoint for make.fun best-national-statistics-site-20261126-0539.
// Stages static site assets (app/) and browser screenshots (screenshots/) into the grading output root,
// then emits a deterministic dossier.json via the vendored make.fun frontend helper.

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const repoDir = dirname(fileURLToPath(import.meta.url));
const targetOutputDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? "/output");

const GATE_LIMITS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 16777216,
} as const;

function stageNationalStatisticsSite(sourceRoot: string, destinationRoot: string): void {
  const sourceApp = join(sourceRoot, "app");
  const sourceShots = join(sourceRoot, "screenshots");

  if (!existsSync(join(sourceApp, "index.html"))) {
    throw new Error("Retto Almanac staging failed: app/index.html is missing.");
  }

  mkdirSync(destinationRoot, { recursive: true });
  cpSync(sourceApp, join(destinationRoot, "app"), { recursive: true });

  const destinationShots = join(destinationRoot, "screenshots");
  mkdirSync(destinationShots, { recursive: true });
  if (existsSync(sourceShots)) {
    const entries = readdirSync(sourceShots).filter((name) => !name.startsWith("."));
    if (entries.length >= 3 && entries.length <= 4) {
      cpSync(sourceShots, destinationShots, { recursive: true });
    }
  }
}

stageNationalStatisticsSite(repoDir, targetOutputDir);
const dossierBytes = buildDossier(targetOutputDir, GATE_LIMITS);
writeFileSync(join(targetOutputDir, "dossier.json"), dossierBytes);