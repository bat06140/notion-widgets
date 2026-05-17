import { createRequire } from "node:module";
import type {
  GumroadWebhookAcceptResult,
  GumroadWebhookPayload,
  GumroadWebhookProcessResult,
} from "../services/gumroad-webhook-service.js";

const require = createRequire(import.meta.url);
const { Router } = require("express") as {
  Router: () => any;
};

export type GumroadWebhookRouterOptions = {
  acceptPayload?: (payload: GumroadWebhookPayload) => GumroadWebhookAcceptResult;
  processPayload?: (
    payload: GumroadWebhookPayload
  ) => Promise<GumroadWebhookProcessResult>;
  schedule?: (task: () => Promise<unknown>) => void;
};

function statusCodeForResult(result: GumroadWebhookProcessResult) {
  if (result.status === "invalid") {
    return 400;
  }

  if (result.status === "failed") {
    return 500;
  }

  return 202;
}

export function createGumroadWebhookRouter({
  acceptPayload,
  processPayload,
  schedule = (task) => {
    setImmediate(() => {
      void task();
    });
  },
}: GumroadWebhookRouterOptions) {
  const router = Router();

  router.post("/api/gumroad/webhook", async (req: any, res: any) => {
    const payload = req.body as GumroadWebhookPayload;

    if (acceptPayload) {
      const result = acceptPayload(payload);

      if (result.status === "accepted") {
        schedule(result.send);
        res.status(202).json({ ok: true });
        return;
      }

      if (result.status === "duplicate") {
        res.status(202).json({ ok: true, duplicate: true });
        return;
      }

      res.status(400).json({ ok: false, reason: result.reason });
      return;
    }

    if (!processPayload) {
      res.status(500).json({ ok: false });
      return;
    }

    const result = await processPayload(payload);

    if (result.status === "sent") {
      res.status(202).json({ ok: true });
      return;
    }

    if (result.status === "duplicate") {
      res.status(202).json({ ok: true, duplicate: true });
      return;
    }

    res.status(statusCodeForResult(result)).json({
      ok: false,
      ...(result.status === "invalid" ? { reason: result.reason } : {}),
    });
  });

  return router;
}
