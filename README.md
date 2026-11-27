# Retto Almanac — Civic Statistical Atlas of Japan

[![make.fun · best-national-statistics-site-20261126-0539](https://make.fun/badge/best-national-statistics-site-20261126-0539.svg)](https://make.fun/bounty/best-national-statistics-site-20261126-0539?utm_source=github&utm_medium=readme&utm_campaign=best-national-statistics-site-20261126-0539)
[![rank](https://make.fun/badge/best-national-statistics-site-20261126-0539/SimplyMar/best-national-statistics-site-20261126-0539/rank.svg)](https://make.fun/bounty/best-national-statistics-site-20261126-0539/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-national-statistics-site-20261126-0539)
[![reward](https://make.fun/badge/best-national-statistics-site-20261126-0539/SimplyMar/best-national-statistics-site-20261126-0539/reward.svg)](https://make.fun/bounty/best-national-statistics-site-20261126-0539?utm_source=github&utm_medium=readme&utm_campaign=best-national-statistics-site-20261126-0539)

An offline, zero-dependency national statistics compendium for Japan built for [make.fun's "Make the best national statistics site" bounty](https://make.fun/bounty/best-national-statistics-site-20261126-0539).

## Highlights

- **National Pulse (`#/`)**: Headline macroeconomic, demographic, labor, and trade indicators with 10-year series, survey provenance, release calendar, and quick CPI purchasing-power converter.
- **47-Prefecture Atlas (`#/regions`)**: Interactive SVG choropleth map of all 47 prefectures with metric switcher, head-to-head prefecture comparison matrix, and full sortable directory.
- **Population & Labor (`#/demographics`)**: Bilateral age-sex population pyramid (`2000`, `2015`, `2024`, `2040` IPSS projection), vital statistics (births, deaths, TFR), and employment by industry.
- **Economy, Prices & Trade (`#/economy`)**: National accounts, CPI basket contributions (`2020=100`), real vs. nominal wage calculator, electricity mix, and merchandise trade by partner and commodity.
- **Data Catalog & Methodology (`#/catalog`)**: Searchable 32-series statistical catalog, CSV/JSON series export, citation builder, and survey methodology documentation.

## Run Locally

```bash
node serve.ts --port 8080
```

## Build Dossier

```bash
MAKEFUN_OUTPUT_DIR=out node main.ts
```