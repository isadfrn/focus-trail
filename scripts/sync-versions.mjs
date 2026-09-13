import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const version = JSON.parse(readFileSync("package.json", "utf8")).version;

if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)*$/.test(version)) {
  throw new Error(`Versão inválida em package.json: ${version}`);
}

function syncNpmPackage(dir) {
  execSync(`npm version ${version} --no-git-tag-version --allow-same-version`, {
    cwd: dir,
    stdio: "inherit",
  });
}

function syncJsonVersion(file) {
  const text = readFileSync(file, "utf8");
  const next = text.replace(/"version":\s*"[^"]*"/, `"version": "${version}"`);
  if (next !== text) writeFileSync(file, next);
}

syncNpmPackage(".");
syncNpmPackage("frontend");
syncNpmPackage("backend");
syncJsonVersion(path.join("frontend", "src-tauri", "tauri.conf.json"));

console.log(`Versões sincronizadas para ${version}.`);

if (process.argv.includes("--amend")) {
  execSync(
    [
      "git add",
      "package.json package-lock.json",
      "frontend/package.json frontend/package-lock.json",
      "backend/package.json backend/package-lock.json",
      "frontend/src-tauri/tauri.conf.json",
    ].join(" "),
    { stdio: "inherit" },
  );
  execSync("git commit --amend --no-edit", { stdio: "inherit" });
  execSync(`git tag -f -a v${version} -m v${version}`, { stdio: "inherit" });
}
