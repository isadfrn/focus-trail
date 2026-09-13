import { readFileSync, writeFileSync } from "node:fs";

const SUMMARY = "backend/coverage/coverage-summary.json";
const README = "README.md";
const START = "<!-- coverage-start -->";
const END = "<!-- coverage-end -->";

const pct = JSON.parse(readFileSync(SUMMARY, "utf8")).total.lines.pct;
const color =
  pct >= 90
    ? "brightgreen"
    : pct >= 80
      ? "green"
      : pct >= 70
        ? "yellowgreen"
        : pct >= 60
          ? "yellow"
          : pct >= 50
            ? "orange"
            : "red";

const badge = `![Coverage](https://img.shields.io/badge/coverage-${pct}%25-${color}?style=flat-square)`;

const readme = readFileSync(README, "utf8");
const region = new RegExp(`${START}[\\s\\S]*?${END}`);
if (!region.test(readme)) {
  console.error(`Coverage markers not found in ${README}`);
  process.exit(1);
}

writeFileSync(README, readme.replace(region, `${START}${badge}${END}`));
console.log(`Coverage badge updated: ${pct}% (${color})`);
