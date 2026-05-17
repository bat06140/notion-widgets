import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  installConsoleLogFileWriter,
  isServerLogFileEnabled,
} from "../src/logging/server-log-file.js";

test("isServerLogFileEnabled enables file logging in development by default", () => {
  assert.equal(isServerLogFileEnabled("development"), true);
  assert.equal(isServerLogFileEnabled("production"), false);
  assert.equal(isServerLogFileEnabled(undefined), false);
});

test("installConsoleLogFileWriter appends console logs to server.log in the app root", () => {
  const rootDir = mkdtempSync(path.join(tmpdir(), "server-log-file-"));
  const consoleCalls: Array<{ level: string; values: unknown[] }> = [];
  const target = {
    log: (...values: unknown[]) => consoleCalls.push({ level: "log", values }),
    info: (...values: unknown[]) => consoleCalls.push({ level: "info", values }),
    warn: (...values: unknown[]) => consoleCalls.push({ level: "warn", values }),
    error: (...values: unknown[]) => consoleCalls.push({ level: "error", values }),
  };

  try {
    const restore = installConsoleLogFileWriter({ rootDir, target });

    target.info("server started");
    target.error(new Error("boot failed"));
    target.log({ route: "/calendar" });
    restore();
    target.warn("after restore");

    const output = readFileSync(path.join(rootDir, "server.log"), "utf8");

    assert.equal(consoleCalls.length, 4);
    assert.match(output, /\[info\] server started/);
    assert.match(output, /\[error\] Error: boot failed/);
    assert.match(output, /\[log\] {"route":"\/calendar"}/);
    assert.doesNotMatch(output, /after restore/);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});
