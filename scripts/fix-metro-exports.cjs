const fs = require("fs");
const path = require("path");

const metroPackagePath = path.join(__dirname, "..", "node_modules", "metro", "package.json");
const expoNgrokPaths = [
  path.join(
    __dirname,
    "..",
    "node_modules",
    "@expo",
    "cli",
    "build",
    "src",
    "start",
    "server",
    "AsyncNgrok.js"
  ),
  path.join(
    __dirname,
    "..",
    "node_modules",
    "expo",
    "node_modules",
    "@expo",
    "cli",
    "build",
    "src",
    "start",
    "server",
    "AsyncNgrok.js"
  ),
];

function patchMetroExports() {
  if (!fs.existsSync(metroPackagePath)) {
    return;
  }

  const metroPackage = JSON.parse(fs.readFileSync(metroPackagePath, "utf8"));
  const exportsField = metroPackage.exports ?? {};

  const requiredExports = {
    "./src": "./src/index.js",
    "./src/*.js": "./src/*.js",
    "./src/*": "./src/*.js",
  };

  let changed = false;

  for (const [key, value] of Object.entries(requiredExports)) {
    if (exportsField[key] !== value) {
      exportsField[key] = value;
      changed = true;
    }
  }

  if (!changed) {
    return;
  }

  metroPackage.exports = exportsField;
  fs.writeFileSync(metroPackagePath, `${JSON.stringify(metroPackage, null, 2)}\n`);
}

function patchExpoNgrokTimeout() {
  const original = "const TUNNEL_TIMEOUT = 10 * 1000;";
  const patched = "const TUNNEL_TIMEOUT = 60 * 1000;";

  for (const expoNgrokPath of expoNgrokPaths) {
    if (!fs.existsSync(expoNgrokPath)) {
      continue;
    }

    const source = fs.readFileSync(expoNgrokPath, "utf8");
    if (!source.includes(original)) {
      continue;
    }

    fs.writeFileSync(expoNgrokPath, source.replace(original, patched));
  }
}

patchMetroExports();
patchExpoNgrokTimeout();
