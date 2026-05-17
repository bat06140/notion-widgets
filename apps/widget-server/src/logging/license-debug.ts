import crypto from "node:crypto";

export type DebugLogger = Pick<Console, "info" | "warn" | "error">;

export function isLicenseDebugEnabled(debugLicenses = process.env.DEBUG_LICENSES) {
  return debugLicenses === "1" || debugLicenses === "true";
}

export function createDebugLogger(logger?: DebugLogger): DebugLogger {
  return logger ?? console;
}

export function fingerprintLicense(license: string | undefined) {
  if (!license) {
    return "missing";
  }

  const normalized = license.trim();
  if (!normalized) {
    return "missing";
  }

  return `sha256:${crypto.createHash("sha256").update(normalized).digest("hex").slice(0, 12)}`;
}

export function logStartupDiagnostics({
  logger,
  port,
  templatePath,
  staticDir,
}: {
  logger: DebugLogger;
  port: number | string;
  templatePath?: string;
  staticDir?: string;
}) {
  logger.info(
    [
      "[license-debug] startup",
      `port=${port}`,
      `GUMROAD_BUNDLE_PRODUCT_ID=${process.env.GUMROAD_BUNDLE_PRODUCT_ID ? "set" : "missing"}`,
      `WIDGET_TEMPLATE_PATH=${templatePath ? "set" : "missing"}`,
      `WIDGET_STATIC_DIR=${staticDir ? "set" : "missing"}`,
    ].join(" ")
  );
}
