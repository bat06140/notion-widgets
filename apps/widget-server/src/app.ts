import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { createGumroadWebhookRouter } from "./routes/gumroad-webhook.js";
import { createWidgetAccessRouter } from "./routes/widget-access.js";
import { createSmtpActivationEmailSender } from "./services/activation-email-sender.js";
import { createGumroadWebhookProcessor } from "./services/gumroad-webhook-service.js";
import { checkAccess as checkAccessDefault } from "./services/license-service.js";
import { type DebugLogger } from "./logging/license-debug.js";

const require = createRequire(import.meta.url);
const express = require("express") as {
  (): any;
  static: (root: string, options?: { index?: boolean }) => any;
  json: () => any;
  urlencoded: (options: { extended: boolean }) => any;
};

export type CreateAppOptions = {
  checkAccess?: typeof checkAccessDefault;
  htmlTemplate?: string;
  templatePath?: string;
  staticDir?: string;
  purchaseUrl?: string;
  debugLicenses?: boolean;
  logger?: DebugLogger;
  processGumroadWebhook?: ReturnType<typeof createGumroadWebhookProcessor>["process"];
};

function loadSpaIndex({
  htmlTemplate,
  templatePath,
}: {
  htmlTemplate?: string;
  templatePath?: string;
}) {
  if (typeof htmlTemplate === "string" && htmlTemplate.length > 0) {
    return htmlTemplate;
  }

  if (typeof templatePath === "string" && templatePath.length > 0) {
    return readFileSync(templatePath, "utf8");
  }

  return undefined;
}

export function createApp({
  checkAccess = checkAccessDefault,
  htmlTemplate,
  templatePath,
  staticDir,
  purchaseUrl,
  processGumroadWebhook,
}: CreateAppOptions = {}) {
  const app = express();
  const spaIndex = loadSpaIndex({ htmlTemplate, templatePath });

  app.disable("x-powered-by");
  if (typeof staticDir === "string" && staticDir.length > 0) {
    app.use(express.static(staticDir, { index: false }));
  }
  app.use(
    createWidgetAccessRouter({
      checkAccess,
      purchaseUrl,
    })
  );
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());
  const gumroadWebhookOptions = processGumroadWebhook
    ? { processPayload: processGumroadWebhook }
    : {
        acceptPayload: createGumroadWebhookProcessor({
          sendActivationEmail: createSmtpActivationEmailSender(),
        }).accept,
      };
  app.use(
    createGumroadWebhookRouter(gumroadWebhookOptions)
  );

  if (typeof spaIndex === "string") {
    app.get(["/", "/calendar", "/clock", "/deadline"], (_req: any, res: any) => {
      res.type("html").send(spaIndex);
    });
  }

  return app;
}
