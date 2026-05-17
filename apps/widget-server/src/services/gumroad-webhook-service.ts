import NodeCache from "node-cache";
import type { WidgetKey } from "@repo/shared";
import {
  createDebugLogger,
  fingerprintLicense,
  type DebugLogger,
} from "../logging/license-debug.js";

export type ActivationEmail = {
  to: string;
  subject: string;
  text: string;
  html: string;
  activationUrl: string;
  activationUrls: string[];
};

export type SendActivationEmail = (email: ActivationEmail) => Promise<void>;

export type GumroadWebhookPayload = Record<string, unknown>;

export type GumroadWebhookProcessResult =
  | { status: "sent" }
  | { status: "duplicate" }
  | { status: "invalid"; reason: string }
  | { status: "failed" };

export type GumroadWebhookAcceptResult =
  | { status: "accepted"; send: () => Promise<GumroadWebhookProcessResult> }
  | { status: "duplicate" }
  | { status: "invalid"; reason: string };

export type GumroadWebhookProcessorOptions = {
  bundleProductId?: string;
  publicWidgetBaseUrl?: string;
  sendActivationEmail: SendActivationEmail;
  processedPurchaseTtlSeconds?: number;
  logger?: DebugLogger;
};

const ACTIVATION_WIDGETS: WidgetKey[] = ["calendar", "deadline", "clock"];

const WIDGET_PATHS: Record<WidgetKey, string> = {
  calendar: "calendar",
  deadline: "deadline",
  clock: "clock",
};

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(value: unknown) {
  const email = normalizeString(value);
  return email.includes("@") ? email : "";
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, "");
}

function matchesBundleProduct({
  productId,
  bundleProductId,
}: {
  productId: string;
  bundleProductId?: string;
}) {
  if (productId && bundleProductId && productId === bundleProductId) {
    return true;
  }

  return false;
}

function buildActivationUrl({
  publicWidgetBaseUrl,
  widget,
  licenseKey,
}: {
  publicWidgetBaseUrl: string;
  widget: WidgetKey;
  licenseKey: string;
}) {
  const url = new URL(
    `${normalizeBaseUrl(publicWidgetBaseUrl)}/${WIDGET_PATHS[widget]}`
  );
  url.searchParams.set("license", licenseKey);
  return url.toString();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildActivationEmail({
  to,
  activationUrls,
}: {
  to: string;
  activationUrls: string[];
}): ActivationEmail {
  const subject = "Vos liens d'activation premium";
  const [primaryActivationUrl] = activationUrls;
  const textLinks = activationUrls.map((url) => `- ${url}`);
  const htmlLinks = activationUrls.map((url) => {
    const escapedUrl = escapeHtml(url);
    return `<li><a href="${escapedUrl}">${escapedUrl}</a></li>`;
  });

  return {
    to,
    subject,
    activationUrl: primaryActivationUrl ?? "",
    activationUrls,
    text: [
      "Merci pour votre achat.",
      "",
      "Voici vos liens d'activation premium :",
      ...textLinks,
      "",
      "Ouvrez le lien du widget souhaité dans Notion ou dans votre navigateur pour activer le mode premium.",
    ].join("\n"),
    html: [
      "<p>Merci pour votre achat.</p>",
      "<p>Voici vos liens d'activation premium :</p>",
      `<ul>${htmlLinks.join("")}</ul>`,
      "<p>Ouvrez le lien du widget souhaité dans Notion ou dans votre navigateur pour activer le mode premium.</p>",
    ].join(""),
  };
}

function purchaseIdFromPayload(payload: GumroadWebhookPayload) {
  return (
    normalizeString(payload.sale_id) ||
    normalizeString(payload.order_id) ||
    normalizeString(payload.id)
  );
}

export function createGumroadWebhookProcessor({
  bundleProductId = process.env.GUMROAD_BUNDLE_PRODUCT_ID,
  publicWidgetBaseUrl = process.env.PUBLIC_WIDGET_BASE_URL ??
    "https://widgets.atomicskills.academy",
  sendActivationEmail,
  processedPurchaseTtlSeconds = Number(
    process.env.GUMROAD_WEBHOOK_DEDUP_TTL_SECONDS ?? 60 * 60 * 24 * 30
  ),
  logger,
}: GumroadWebhookProcessorOptions) {
  const processedPurchases = new NodeCache({
    stdTTL: processedPurchaseTtlSeconds,
    useClones: false,
  });
  const debugLogger = createDebugLogger(logger);

  function accept(payload: GumroadWebhookPayload): GumroadWebhookAcceptResult {
    const email = normalizeEmail(payload.email);
    const licenseKey = normalizeString(payload.license_key);
    const productId = normalizeString(payload.product_id);
    const purchaseId = purchaseIdFromPayload(payload);
    const licenseFingerprint = fingerprintLicense(licenseKey);

    if (!email) {
      return { status: "invalid", reason: "email client manquant" };
    }

    if (!licenseKey) {
      return { status: "invalid", reason: "license_key manquant" };
    }

    if (!productId) {
      return { status: "invalid", reason: "product_id manquant" };
    }

    if (!purchaseId) {
      return { status: "invalid", reason: "sale_id ou order_id manquant" };
    }

    if (processedPurchases.get(purchaseId)) {
      debugLogger.info(`[gumroad-webhook] duplicate purchase=${purchaseId}`);
      return { status: "duplicate" };
    }

    const isBundlePurchase = matchesBundleProduct({
      productId,
      bundleProductId,
    });

    if (!isBundlePurchase) {
      return { status: "invalid", reason: "produit Gumroad inconnu" };
    }
    processedPurchases.set(purchaseId, true);

    const activationUrls = ACTIVATION_WIDGETS.map((widget) =>
      buildActivationUrl({
        publicWidgetBaseUrl,
        widget,
        licenseKey,
      })
    );
    const activationEmail = buildActivationEmail({ to: email, activationUrls });

    return {
      status: "accepted",
      send: async () => {
        try {
          await sendActivationEmail(activationEmail);
          return { status: "sent" };
        } catch (error) {
          processedPurchases.del(purchaseId);
          const message = error instanceof Error ? error.message : "unknown";
          debugLogger.error(
            `[gumroad-webhook] email failed purchase=${purchaseId} license=${licenseFingerprint} error="${message.replaceAll(licenseKey, "[redacted]")}"`
          );
          return { status: "failed" };
        }
      },
    };
  }

  async function processPayload(
    payload: GumroadWebhookPayload
  ): Promise<GumroadWebhookProcessResult> {
    const accepted = accept(payload);

    if (accepted.status !== "accepted") {
      return accepted;
    }

    return accepted.send();
  }

  return { accept, process: processPayload };
}
