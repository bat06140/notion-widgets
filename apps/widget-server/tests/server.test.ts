import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../src/app.js";

const htmlTemplate =
  "<!DOCTYPE html><html><head></head><body><div id=\"root\"></div></body></html>";

async function withServer(
  app: ReturnType<typeof createApp>,
  callback: (baseUrl: string) => Promise<void>
) {
  const server = await new Promise<import("node:http").Server>((resolve, reject) => {
    const nextServer = app.listen(0, () => resolve(nextServer));
    nextServer.once("error", reject);
  });

  try {
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Unable to resolve test server port");
    }

    await callback(`http://127.0.0.1:${address.port}`);
  } finally {
    if (!server.listening) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }
}

test("widget access api returns denied access without leaking the license", async () => {
  let receivedInput: { license: string | undefined; widget?: string } | undefined;
  const app = createApp({
    checkAccess: async (license: string | undefined, options?: { widget?: string }) => {
      receivedInput = { license, widget: options?.widget };
      return {
        access: false,
        reason: "Licence introuvable",
      };
    },
    htmlTemplate,
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(
      `${baseUrl}/api/widget-access?widget=calendar&license=BAD-KEY`
    );
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(receivedInput, { license: "BAD-KEY", widget: "calendar" });
    assert.deepEqual(payload, {
      accessGranted: false,
      purchaseUrl: "https://atomicskills.academy/widgets-notion/",
      reason: "Licence introuvable",
    });
  });
});

test("static shell serves the frontend app for widget routes", async () => {
  const app = createApp({
    checkAccess: async () => ({ access: true }),
    htmlTemplate,
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/calendar?license=BAD-KEY`);
    const responseHtml = await response.text();

    assert.equal(response.status, 200);
    assert.match(responseHtml, /<div id="root"><\/div>/);
    assert.doesNotMatch(responseHtml, /"widget":"calendar"/);
  });
});

test("static shell serves the frontend app for the deadline route", async () => {
  const app = createApp({
    checkAccess: async () => ({ access: true }),
    htmlTemplate,
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/deadline?license=BAD-KEY`);
    const responseHtml = await response.text();

    assert.equal(response.status, 200);
    assert.match(responseHtml, /<div id="root"><\/div>/);
  });
});

test("gumroad webhook route parses purchase webhooks and returns accepted", async () => {
  let receivedPayload: Record<string, unknown> | undefined;
  const app = createApp({
    checkAccess: async () => ({ access: false, reason: "Licence manquante" }),
    processGumroadWebhook: async (payload) => {
      receivedPayload = payload;
      return { status: "sent" };
    },
    htmlTemplate,
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/gumroad/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        email: "buyer@example.com",
        license_key: "SECRET-LICENSE",
        product_id: "bundle-product",
        sale_id: "sale-123",
      }),
    });
    const payload = await response.json();

    assert.equal(response.status, 202);
    assert.deepEqual(payload, { ok: true });
    assert.deepEqual(receivedPayload, {
      email: "buyer@example.com",
      license_key: "SECRET-LICENSE",
      product_id: "bundle-product",
      sale_id: "sale-123",
    });
  });
});
