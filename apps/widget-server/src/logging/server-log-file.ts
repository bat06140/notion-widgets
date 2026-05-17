import { appendFileSync } from "node:fs";
import path from "node:path";

type ConsoleLogLevel = "log" | "info" | "warn" | "error";

type ConsoleLike = Pick<Console, ConsoleLogLevel>;

export function isServerLogFileEnabled(nodeEnv = process.env.NODE_ENV) {
  return nodeEnv === "development";
}

function formatLogValue(value: unknown) {
  if (value instanceof Error) {
    return value.stack ?? `Error: ${value.message}`;
  }

  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function formatLogLine(level: ConsoleLogLevel, values: unknown[]) {
  return [
    new Date().toISOString(),
    `[${level}]`,
    values.map(formatLogValue).join(" "),
  ].join(" ");
}

export function installConsoleLogFileWriter({
  rootDir,
  target = console,
  fileName = "server.log",
}: {
  rootDir: string;
  target?: ConsoleLike;
  fileName?: string;
}) {
  const filePath = path.join(rootDir, fileName);
  appendFileSync(filePath, "", "utf8");

  const originals: Record<ConsoleLogLevel, (...values: unknown[]) => void> = {
    log: target.log.bind(target),
    info: target.info.bind(target),
    warn: target.warn.bind(target),
    error: target.error.bind(target),
  };

  (Object.keys(originals) as ConsoleLogLevel[]).forEach((level) => {
    target[level] = (...values: unknown[]) => {
      originals[level](...values);
      appendFileSync(filePath, `${formatLogLine(level, values)}\n`, "utf8");
    };
  });

  return () => {
    (Object.keys(originals) as ConsoleLogLevel[]).forEach((level) => {
      target[level] = originals[level];
    });
  };
}
