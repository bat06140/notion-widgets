import assert from "node:assert/strict";
import test from "node:test";
import {
  fingerprintLicense,
  logStartupDiagnostics,
} from "../src/logging/license-debug.js";

test("fingerprintLicense masks plaintext license values", () => {
  const fingerprint = fingerprintLicense("VALID-KEY-123");

  assert.match(fingerprint, /^sha256:/);
  assert.doesNotMatch(fingerprint, /VALID-KEY-123/);
  assert.equal(fingerprintLicense(undefined), "missing");
});

test("logStartupDiagnostics reports env presence without leaking secrets", () => {
  const logs: string[] = [];
  const previousEnv = {
    GUMROAD_BUNDLE_PRODUCT_ID: process.env.GUMROAD_BUNDLE_PRODUCT_ID,
  };

  process.env.GUMROAD_BUNDLE_PRODUCT_ID = "super-secret-id";

  try {
    logStartupDiagnostics({
      logger: {
        info: (message: string) => logs.push(message),
        warn: () => undefined,
        error: () => undefined,
      },
      port: 3000,
      templatePath: "/tmp/widget.html",
      staticDir: "/tmp/static",
    });
  } finally {
    if (previousEnv.GUMROAD_BUNDLE_PRODUCT_ID === undefined) {
      delete process.env.GUMROAD_BUNDLE_PRODUCT_ID;
    } else {
      process.env.GUMROAD_BUNDLE_PRODUCT_ID = previousEnv.GUMROAD_BUNDLE_PRODUCT_ID;
    }
  }

  const output = logs.join("\n");
  assert.match(output, /\[license-debug\] startup/);
  assert.match(output, /GUMROAD_BUNDLE_PRODUCT_ID=set/);
  assert.match(output, /WIDGET_TEMPLATE_PATH=set/);
  assert.match(output, /WIDGET_STATIC_DIR=set/);
  assert.doesNotMatch(output, /super-secret-id/);
});
