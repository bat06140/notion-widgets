import assert from "node:assert/strict";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  loadEnvironmentFiles,
  resolveServerPort,
  resolveWidgetAssetPaths,
} from "../src/index.js";

test("resolveWidgetAssetPaths falls back to the built widget client assets", () => {
  const resolved = resolveWidgetAssetPaths();

  assert.match(resolved.templatePath, /apps\/widget-client\/dist\/index\.html$/);
  assert.match(resolved.staticDir, /apps\/widget-client\/dist$/);
  assert.equal(existsSync(resolved.templatePath), true);
  assert.equal(existsSync(resolved.staticDir), true);
});

test("resolveServerPort prioritizes the standard PORT environment variable", () => {
  assert.equal(
    resolveServerPort({ PORT: "3000", WIDGET_DEV_BACKEND_PORT: "3001" }),
    3000
  );
});

test("loadEnvironmentFiles lets .env.local override .env outside production", () => {
  const previousDebugLicenses = process.env.DEBUG_LICENSES;
  const rootDir = mkdtempSync(path.join(tmpdir(), "widget-env-"));

  try {
    delete process.env.DEBUG_LICENSES;
    writeFileSync(path.join(rootDir, ".env"), "DEBUG_LICENSES=false\n");
    writeFileSync(path.join(rootDir, ".env.local"), "DEBUG_LICENSES=true\n");

    loadEnvironmentFiles({ rootDir, nodeEnv: "development" });

    assert.equal(process.env.DEBUG_LICENSES, "true");
  } finally {
    if (previousDebugLicenses === undefined) {
      delete process.env.DEBUG_LICENSES;
    } else {
      process.env.DEBUG_LICENSES = previousDebugLicenses;
    }
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("loadEnvironmentFiles ignores .env.local in production", () => {
  const previousDebugLicenses = process.env.DEBUG_LICENSES;
  const rootDir = mkdtempSync(path.join(tmpdir(), "widget-env-"));

  try {
    delete process.env.DEBUG_LICENSES;
    writeFileSync(path.join(rootDir, ".env"), "DEBUG_LICENSES=false\n");
    writeFileSync(path.join(rootDir, ".env.local"), "DEBUG_LICENSES=true\n");

    loadEnvironmentFiles({ rootDir, nodeEnv: "production" });

    assert.equal(process.env.DEBUG_LICENSES, "false");
  } finally {
    if (previousDebugLicenses === undefined) {
      delete process.env.DEBUG_LICENSES;
    } else {
      process.env.DEBUG_LICENSES = previousDebugLicenses;
    }
    rmSync(rootDir, { recursive: true, force: true });
  }
});
