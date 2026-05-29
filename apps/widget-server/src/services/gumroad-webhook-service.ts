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

const ACTIVATION_WIDGETS: WidgetKey[] = ["clock", "calendar", "deadline"];

const WIDGET_PATHS: Record<WidgetKey, string> = {
  calendar: "calendar",
  deadline: "deadline",
  clock: "clock",
};

const WIDGET_LABELS: Record<WidgetKey, string> = {
  calendar: "Calendar",
  deadline: "Deadline",
  clock: "Clock",
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
  const subject = "Your Branding Pack is ready — your licenses + access links";
  const [primaryActivationUrl] = activationUrls;
  const linkItems = ACTIVATION_WIDGETS.map((widget, index) => ({
    label: WIDGET_LABELS[widget],
    url: activationUrls[index] ?? "",
  })).filter((item) => item.url);
  const textLinks = linkItems.map((item) => `- ${item.label}: ${item.url}`);
  const htmlLinks = linkItems.map((item) => {
    const escapedUrl = escapeHtml(item.url);
    return `<li>${escapeHtml(item.label)}: <a href="${escapedUrl}">${escapedUrl}</a></li>`;
  });

  return {
    to,
    subject,
    activationUrl: primaryActivationUrl ?? "",
    activationUrls,
    text: [
      "🇬🇧 Branding Pack — 3 Notion Widgets in your brand colors (Clock + Calendar + Deadline)",
      "",
      "Hello,",
      "",
      "Thank you for your purchase — welcome to the Branding Pack (Clock + Calendar + Deadline).",
      "Here are your activation links to install the 3 widgets:",
      "",
      ...textLinks,
      "",
      "Important: Your license is unique per purchase (one license code per order).",
      "",
      "How to install a widget (30 seconds)",
      "",
      "For each widget:",
      "",
      "- Copy the widget URL (with your license code)",
      "- In Notion, paste the link into a new block",
      "- Select Embed",
      "- Resize + choose your colors (text/background) and you’re done",
      "",
      "Enjoy your new clean, on-brand Notion setup",
      "",
      "Sindy Desquerre | Atomic Skills Academy",
      "Notion Ambassador • Certified trainer (Generative AI & active learning)",
      "",
      "---",
      "",
      "🇫🇷 Pack Branding — 3 Widgets Notion aux couleurs de votre marque (Horloge + Calendrier + Échéance)",
      "",
      "Bonjour,",
      "",
      "Merci pour votre achat — bienvenue dans le Pack Branding (Clock + Calendar + Deadline).",
      "Voici les liens d’activation pour installer les 3 widgets du pack Branding :",
      "",
      ...textLinks,
      "",
      "Important : votre licence est unique par achat (un code de licence par commande).",
      "",
      "Comment installer un widget (30 secondes)",
      "",
      "Pour chaque widget :",
      "",
      "- Copiez l’URL du widget (avec votre code licence ci-dessus)",
      "- Dans Notion, collez le lien dans un nouveau bloc",
      "- Sélectionnez Intégration",
      "- Ajustez la taille + choisissez vos couleurs (texte/fond)",
      "",
      "Profitez bien de votre Notion plus beau et plus cohérent.",
      "",
      "Besoin d’aide (ou envie de me montrer votre setup) ? Répondez simplement à cet email, je serai ravie de vous aider.",
      "",
      "Sindy DESQUERRE",
      "Notion Ambassador • Formatrice certifiée en IA générative & pédagogie active",
      "LinkedIn: https://www.linkedin.com/in/sindy-desquerre",
      "atomicskills.academy: https://www.atomicskills.academy/",
      "YouTube: https://www.youtube.com/@SindyAtomic",
    ].join("\n"),
    html: [
      "<p><strong>🇬🇧 Branding Pack — 3 Notion Widgets in your brand colors (Clock + Calendar + Deadline)</strong></p>",
      "<p>Hello,</p>",
      "<p>Thank you for your purchase — welcome to the <strong>Branding Pack</strong> (Clock + Calendar + Deadline).<br>Here are your activation links to install the 3 widgets:</p>",
      `<ul>${htmlLinks.join("")}</ul>`,
      "<p><strong>Important:</strong> Your license is <strong>unique per purchase</strong> (one license code per order).</p>",
      "<p><strong>How to install a widget (30 seconds)</strong></p>",
      "<p>For each widget:</p>",
      "<ul><li>Copy the widget URL (with your license code)</li><li>In Notion, paste the link into a new block</li><li>Select <strong>Embed</strong></li><li>Resize + choose your colors (text/background) and you’re done</li></ul>",
      "<p>Enjoy your new clean, on-brand Notion setup</p>",
      "<p><strong>Sindy Desquerre | Atomic Skills Academy</strong><br>Notion Ambassador • Certified trainer (Generative AI & active learning)</p>",
      "<hr>",
      "<p><strong>🇫🇷 Pack Branding — 3 Widgets Notion aux couleurs de votre marque (Horloge + Calendrier + Échéance)</strong></p>",
      "<p>Bonjour,</p>",
      "<p>Merci pour votre achat — bienvenue dans le <strong>Pack Branding</strong> (Clock + Calendar + Deadline).<br>Voici les liens d’activation pour <strong>installer les 3 widgets du pack Branding :</strong></p>",
      `<ul>${htmlLinks.join("")}</ul>`,
      "<p><strong>Important :</strong> votre licence est <strong>unique par achat</strong> (un code de licence par commande).</p>",
      "<h3>Comment installer un widget (30 secondes)</h3>",
      "<p>Pour chaque widget :</p>",
      "<ul><li>Copiez l’URL du widget (avec votre code licence ci-dessus)</li><li>Dans Notion, collez le lien dans un nouveau bloc</li><li>Sélectionnez <strong>Intégration</strong></li><li>Ajustez la taille + choisissez vos couleurs (texte/fond)</li></ul>",
      "<p>Profitez bien de votre Notion plus beau et plus cohérent.</p>",
      "<p>Besoin d’aide (ou envie de me montrer votre setup) ? Répondez simplement à cet email, je serai ravie de vous aider.</p>",
      '<p><strong>Sindy DESQUERRE</strong><br>Notion Ambassador • Formatrice certifiée en IA générative & pédagogie active<br><a href="https://www.linkedin.com/in/sindy-desquerre">LinkedIn</a> | <a href="https://www.atomicskills.academy/">atomicskills.academy</a> | <a href="https://www.youtube.com/@SindyAtomic">YouTube</a></p>',
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

function payloadKeys(payload: GumroadWebhookPayload) {
  return Object.keys(payload).sort().join(",") || "none";
}

function logInvalidWebhook({
  debugLogger,
  purchaseId,
  productId,
  licenseFingerprint,
  reason,
  hasEmail,
}: {
  debugLogger: DebugLogger;
  purchaseId: string;
  productId: string;
  licenseFingerprint: string;
  reason: string;
  hasEmail: boolean;
}) {
  debugLogger.warn(
    [
      "[gumroad-webhook] invalid",
      `purchase=${purchaseId || "missing"}`,
      `reason="${reason}"`,
      `email=${hasEmail ? "set" : "missing"}`,
      `product=${productId || "missing"}`,
      `license=${licenseFingerprint}`,
    ].join(" ")
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

    debugLogger.debug(
      [
        "[gumroad-webhook] received",
        `purchase=${purchaseId || "missing"}`,
        `email=${email ? "set" : "missing"}`,
        `product=${productId || "missing"}`,
        `license=${licenseFingerprint}`,
        `keys=${payloadKeys(payload)}`,
      ].join(" ")
    );

    if (!email) {
      logInvalidWebhook({
        debugLogger,
        purchaseId,
        productId,
        licenseFingerprint,
        reason: "email client manquant",
        hasEmail: false,
      });
      return { status: "invalid", reason: "email client manquant" };
    }

    if (!licenseKey) {
      logInvalidWebhook({
        debugLogger,
        purchaseId,
        productId,
        licenseFingerprint,
        reason: "license_key manquant",
        hasEmail: true,
      });
      return { status: "invalid", reason: "license_key manquant" };
    }

    if (!productId) {
      logInvalidWebhook({
        debugLogger,
        purchaseId,
        productId,
        licenseFingerprint,
        reason: "product_id manquant",
        hasEmail: true,
      });
      return { status: "invalid", reason: "product_id manquant" };
    }

    if (!purchaseId) {
      logInvalidWebhook({
        debugLogger,
        purchaseId,
        productId,
        licenseFingerprint,
        reason: "sale_id ou order_id manquant",
        hasEmail: true,
      });
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
      debugLogger.warn(
        [
          "[gumroad-webhook] product mismatch",
          `purchase=${purchaseId}`,
          `product=${productId}`,
          `expectedBundle=${bundleProductId ? "set" : "missing"}`,
          `license=${licenseFingerprint}`,
        ].join(" ")
      );
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

    debugLogger.debug(
      [
        "[gumroad-webhook] accepted",
        `purchase=${purchaseId}`,
        `product=${productId}`,
        `activationUrls=${activationUrls.length}`,
      ].join(" ")
    );

    return {
      status: "accepted",
      send: async () => {
        try {
          debugLogger.debug(
            [
              "[gumroad-webhook] email send started",
              `purchase=${purchaseId}`,
              `to=${email ? "set" : "missing"}`,
              `activationUrls=${activationUrls.length}`,
            ].join(" ")
          );
          await sendActivationEmail(activationEmail);
          debugLogger.info(
            [
              "[gumroad-webhook] email sent",
              `purchase=${purchaseId}`,
              `to=${email ? "set" : "missing"}`,
              `activationUrls=${activationUrls.length}`,
            ].join(" ")
          );
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
