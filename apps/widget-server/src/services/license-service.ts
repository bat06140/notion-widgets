import NodeCache from "node-cache";
import type { WidgetKey } from "@repo/shared";
import {
  createDebugLogger,
  fingerprintLicense,
  isLicenseDebugEnabled,
  type DebugLogger,
} from "../logging/license-debug.js";

type AccessGranted = {
  access: true;
  reason?: undefined;
};

type AccessDenied = {
  access: false;
  reason: string;
};

export type LicenseAccessResult = AccessGranted | AccessDenied;

type CacheEntry = {
  result: LicenseAccessResult;
  expiresAt?: Date;
};

export type VerifyGumroadLicense = (productId: string, licenseKey: string) => Promise<any>;
export type LicenseAccessOptions = {
  widget?: WidgetKey;
};

export type LicenseServiceOptions = {
  cacheTtlSeconds?: number;
  verifyLicense?: VerifyGumroadLicense;
  now?: () => Date;
  debugLicenses?: boolean;
  logger?: DebugLogger;
  productId?: string;
  productIds?: string[];
  bundleProductId?: string;
};

function grantAccess(): LicenseAccessResult {
  return { access: true };
}

function denyAccess(reason: string): LicenseAccessResult {
  return { access: false, reason };
}

function normalizeKey(key: unknown) {
  return typeof key === "string" ? key.trim() : "";
}

function normalizeProductIds(productIds: Array<string | undefined>) {
  const normalized: string[] = [];

  for (const productId of productIds) {
    const nextProductId = productId?.trim();
    if (nextProductId && !normalized.includes(nextProductId)) {
      normalized.push(nextProductId);
    }
  }

  return normalized;
}

const defaultVerifyLicense: VerifyGumroadLicense = async (productId, licenseKey) => {
  const response = await fetch("https://api.gumroad.com/v2/licenses/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      product_id: productId,
      license_key: licenseKey,
    }),
  });

  if (response.status === 404) {
    return { success: false };
  }

  if (!response.ok) {
    throw new Error(`Gumroad API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

export function createLicenseService({
  cacheTtlSeconds = Number(process.env.CACHE_TTL_SECONDS ?? 86400),
  verifyLicense = defaultVerifyLicense,
  now = () => new Date(),
  debugLicenses = isLicenseDebugEnabled(),
  logger,
  productId,
  productIds = [],
  bundleProductId = process.env.GUMROAD_BUNDLE_PRODUCT_ID,
}: LicenseServiceOptions = {}) {
  const cache = new NodeCache({
    stdTTL: cacheTtlSeconds,
    useClones: false,
  });
  const debugLogger = createDebugLogger(logger);

  const productIdsToCheck = normalizeProductIds([
    bundleProductId,
    ...productIds,
    productId,
  ]);

  async function checkAccess(
    key: string | undefined,
    options: LicenseAccessOptions = {}
  ): Promise<LicenseAccessResult> {
    void options;
    const normalizedKey = normalizeKey(key);
    const licenseFingerprint = fingerprintLicense(normalizedKey);

    if (!normalizedKey) {
      if (debugLicenses) {
        debugLogger.warn(
          `[license-debug] access denied license=${licenseFingerprint} reason="Licence manquante"`
        );
      }
      return denyAccess("Licence manquante");
    }

    if (productIdsToCheck.length === 0) {
      if (debugLicenses) {
        debugLogger.error(
          `[license-debug] access denied license=${licenseFingerprint} reason="Gumroad product id manquant"`
        );
      }
      return denyAccess("Configuration serveur invalide");
    }

    const cacheKey = `${normalizedKey}:${productIdsToCheck.join("|")}`;
    const cached = cache.get(cacheKey) as CacheEntry | undefined;
    if (cached) {
      if (cached.expiresAt && cached.expiresAt <= now()) {
        cache.del(cacheKey);
      } else {
        if (debugLicenses) {
          debugLogger.info(
            `[license-debug] cache hit license=${licenseFingerprint} decision=${cached.result.access ? "granted" : "denied"}`
          );
        }
        return cached.result;
      }
    }

    let result: LicenseAccessResult = denyAccess("Licence introuvable ou invalide");
    let expiresAt: Date | undefined;
    let apiError = false;

    for (const pId of productIdsToCheck) {
      try {
        if (debugLicenses) {
          debugLogger.info(
            `[license-debug] verify start license=${licenseFingerprint} productId=${pId}`
          );
        }
        
        const data = await verifyLicense(pId, normalizedKey);

        if (!data.success) {
          result = denyAccess("Licence introuvable ou invalide");
        } else if (data.purchase?.refunded) {
          result = denyAccess("Licence remboursée");
        } else if (data.purchase?.chargebacked || data.purchase?.disputed) {
          result = denyAccess("Licence contestée");
        } else {
          const currentTime = now();
          if (data.purchase?.subscription_ended_at && new Date(data.purchase.subscription_ended_at) <= currentTime) {
            result = denyAccess("Abonnement terminé");
          } else if (data.purchase?.subscription_cancelled_at && new Date(data.purchase.subscription_cancelled_at) <= currentTime) {
            result = denyAccess("Abonnement annulé");
          } else if (data.purchase?.subscription_failed_at && new Date(data.purchase.subscription_failed_at) <= currentTime) {
            result = denyAccess("Échec du paiement de l'abonnement");
          } else {
            result = grantAccess();
            if (data.purchase?.subscription_ended_at) {
               expiresAt = new Date(data.purchase.subscription_ended_at);
            }
            break; // Stop checking, we found a valid license
          }
        }
      } catch (error) {
        if (debugLicenses) {
          const message = error instanceof Error ? error.message : "unknown";
          debugLogger.error(
            `[license-debug] verify failed license=${licenseFingerprint} productId=${pId} error="${message}"`
          );
        }
        apiError = true;
      }
    }

    if (!result.access && apiError) {
      result = denyAccess("Service indisponible");
    }

    const entry: CacheEntry = { result, expiresAt };
    let ttlSeconds = cacheTtlSeconds;

    if (expiresAt) {
      const remainingMs = expiresAt.getTime() - now().getTime();
      const remainingSeconds = Math.max(1, Math.ceil(remainingMs / 1000));
      ttlSeconds = Math.min(cacheTtlSeconds, remainingSeconds);
    }

    if (ttlSeconds > 0) {
      cache.set(cacheKey, entry, ttlSeconds);
    }

    if (debugLicenses) {
      debugLogger.info(
        `[license-debug] access ${result.access ? "granted" : "denied"} license=${licenseFingerprint} reason="${result.access ? "ok" : result.reason}"`
      );
    }

    return result;
  }

  async function refreshIndex() {
    // No-op for Gumroad
  }

  return { checkAccess, refreshIndex };
}

export const { checkAccess, refreshIndex } = createLicenseService();
