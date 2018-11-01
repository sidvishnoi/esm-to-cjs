const { readFileSync, writeFileSync } = require("fs");
const path = require("path");

const dir = process.cwd();

function editPackageJson(transform) {
  const src = path.join(dir, "./package.backup.json");
  const dest = path.join(dir, "./package.json");
  const content = readFileSync(src, "utf8");
  const json = JSON.parse(content);
  transform(json);
  writeFileSync(dest, JSON.stringify(json, null, 2), "utf8");
}

function copyFile(src, dest, transform) {
  src = path.join(dir, src);
  dest = path.join(dir, dest);
  let content = readFileSync(src, "utf8");
  if (transform && typeof transform === "function") {
    content = transform(content);
  }
  writeFileSync(dest, content, "utf8");
}

function backupPackageJson() {
  copyFile("./package.json", "./package.backup.json");
}

function restorePackageJson() {
  copyFile("./package.backup.json", "./package.json");
}

module.exports.copyFile = copyFile;
module.exports.editPackageJson = editPackageJson;
module.exports.backupPackageJson = backupPackageJson;
module.exports.restorePackageJson = restorePackageJson;
