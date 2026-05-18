import dotenv from "dotenv";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";
import path from "node:path";
import type { CreateAppOptions } from "./app.js";
import {
  createDebugLogger,
  isLicenseDebugEnabled,
  logStartupDiagnostics,
} from "./logging/license-debug.js";
import { createServerLogger } from "./logging/server-log-file.js";

function resolvePackageRoot(fromDir: string) {
  let currentDir = fromDir;

  while (true) {
    if (existsSync(path.join(currentDir, "package.json"))) {
      return currentDir;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      throw new Error("Unable to resolve widget-server package root");
    }

    currentDir = parentDir;
  }
}

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = resolvePackageRoot(moduleDir);

export function loadEnvironmentFiles({
  rootDir = packageRoot,
  nodeEnv = process.env.NODE_ENV,
}: {
  rootDir?: string;
  nodeEnv?: string;
} = {}) {
  dotenv.config({ path: path.join(rootDir, ".env") });

  if (nodeEnv !== "production") {
    dotenv.config({ path: path.join(rootDir, ".env.local"), override: true });
  }
}

loadEnvironmentFiles();

export function resolveWidgetAssetPaths({
  templatePath = process.env.WIDGET_TEMPLATE_PATH,
  staticDir = process.env.WIDGET_STATIC_DIR,
}: {
  templatePath?: string;
  staticDir?: string;
} = {}) {
  const defaultStaticDir = path.resolve(packageRoot, "../widget-client/dist");
  const resolveAssetPath = (value: string) =>
    path.isAbsolute(value) ? value : path.resolve(packageRoot, value);

  return {
    templatePath:
      templatePath && templatePath.length > 0
        ? resolveAssetPath(templatePath)
        : path.join(defaultStaticDir, "index.html"),
    staticDir:
      staticDir && staticDir.length > 0
        ? resolveAssetPath(staticDir)
        : defaultStaticDir,
  };
}

export function resolveServerPort(
  env: Record<string, string | undefined> = process.env
): string | number {
  const portStr = env.PORT;
  if (!portStr) return 3000;
  const parsedPort = Number(portStr);
  return Number.isNaN(parsedPort) ? portStr : parsedPort;
}

export async function startServer({
  port = resolveServerPort(),
  templatePath,
  staticDir,
  debugLicenses = isLicenseDebugEnabled(),
  logger,
  ...options
}: CreateAppOptions & { port?: number | string } = {}) {
  const { createApp } = await import("./app.js");
  const resolvedAssets = resolveWidgetAssetPaths({ templatePath, staticDir });
  const debugLogger = createDebugLogger(
    logger ?? createServerLogger({ rootDir: packageRoot })
  );

  if (debugLicenses) {
    logStartupDiagnostics({
      logger: debugLogger,
      port,
      templatePath: resolvedAssets.templatePath,
      staticDir: resolvedAssets.staticDir,
    });
  }

  const app = createApp({
    ...options,
    templatePath: resolvedAssets.templatePath,
    staticDir: resolvedAssets.staticDir,
    debugLicenses,
    logger: debugLogger,
  });

  return await new Promise<import("node:http").Server>((resolve, reject) => {
    const nextServer = app.listen(port, () => {
      setImmediate(() => resolve(nextServer));
    });
    nextServer.once("error", (error: Error) => {
      reject(error);
    });
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startServer().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
