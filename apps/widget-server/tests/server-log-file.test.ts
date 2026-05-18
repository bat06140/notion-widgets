import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  createServerLogger,
  isServerLogFileEnabled,
} from "../src/logging/server-log-file.js";

test("isServerLogFileEnabled enables file logging in development by default", () => {
  assert.equal(isServerLogFileEnabled("development"), true);
  assert.equal(isServerLogFileEnabled("production"), false);
  assert.equal(isServerLogFileEnabled(undefined), false);
});

test("createServerLogger writes pino logs to server.log in development", async () => {
  const rootDir = mkdtempSync(path.join(tmpdir(), "server-log-file-"));
  const filePath = path.join(rootDir, "server.log");

  try {
    const logger = createServerLogger({ rootDir, nodeEnv: "development" });

    assert.equal(existsSync(filePath), true);
    assert.equal(logger.level, "debug");

    logger.debug("webhook received");
    logger.info({ purchase: "sale-123" }, "email sent");
    logger.flush();
    await new Promise((resolve) => setTimeout(resolve, 20));

    const output = readFileSync(filePath, "utf8");
    const lines = output
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as Record<string, unknown>);

    assert.equal(lines.length, 2);
    assert.equal(lines[0]?.level, 20);
    assert.equal(lines[0]?.msg, "webhook received");
    assert.equal(lines[1]?.level, 30);
    assert.equal(lines[1]?.msg, "email sent");
    assert.equal(lines[1]?.purchase, "sale-123");
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("createServerLogger uses production level without creating server.log", () => {
  const rootDir = mkdtempSync(path.join(tmpdir(), "server-log-file-"));

  try {
    const logger = createServerLogger({ rootDir, nodeEnv: "production" });

    assert.equal(logger.level, "info");
    assert.equal(existsSync(path.join(rootDir, "server.log")), false);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});
