import { appendFileSync } from "node:fs";
import path from "node:path";
import pino from "pino";

export function isServerLogFileEnabled(nodeEnv = process.env.NODE_ENV) {
  return nodeEnv === "development";
}

export function createServerLogger({
  rootDir,
  nodeEnv = process.env.NODE_ENV,
  fileName = "server.log",
}: {
  rootDir: string;
  nodeEnv?: string;
  fileName?: string;
}) {
  const loggerOptions = {
    base: undefined,
    level: nodeEnv === "development" ? "debug" : "info",
    timestamp: pino.stdTimeFunctions.isoTime,
  };

  if (!isServerLogFileEnabled(nodeEnv)) {
    return pino(loggerOptions);
  }

  const filePath = path.join(rootDir, fileName);
  appendFileSync(filePath, "", "utf8");

  return pino(
    loggerOptions,
    pino.destination({
      dest: filePath,
      sync: false,
    })
  );
}
