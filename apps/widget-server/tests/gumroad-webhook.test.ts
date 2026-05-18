import assert from "node:assert/strict";
import test from "node:test";
import { createGumroadWebhookProcessor } from "../src/services/gumroad-webhook-service.js";

test("Gumroad webhook processor emails all widget activation links once per sale", async () => {
  const emails: Array<{
    to: string;
    subject: string;
    text: string;
    html: string;
    activationUrl: string;
    activationUrls: string[];
  }> = [];

  const processor = createGumroadWebhookProcessor({
    bundleProductId: "bundle-product",
    publicWidgetBaseUrl: "https://widgets.atomicskills.academy",
    sendActivationEmail: async (email) => {
      emails.push(email);
    },
  });

  const first = await processor.process({
    email: "buyer@example.com",
    license_key: "SECRET-LICENSE",
    product_id: "bundle-product",
    sale_id: "sale-123",
  });
  const replay = await processor.process({
    email: "buyer@example.com",
    license_key: "SECRET-LICENSE",
    product_id: "bundle-product",
    sale_id: "sale-123",
  });

  assert.deepEqual(first, { status: "sent" });
  assert.deepEqual(replay, { status: "duplicate" });
  assert.equal(emails.length, 1);
  assert.equal(emails[0]?.to, "buyer@example.com");
  assert.equal(emails[0]?.activationUrl, emails[0]?.activationUrls[0]);
  assert.deepEqual(emails[0]?.activationUrls, [
    "https://widgets.atomicskills.academy/calendar?license=SECRET-LICENSE",
    "https://widgets.atomicskills.academy/deadline?license=SECRET-LICENSE",
    "https://widgets.atomicskills.academy/clock?license=SECRET-LICENSE",
  ]);
  assert.match(emails[0]?.subject ?? "", /activation/i);
  assert.match(emails[0]?.text ?? "", /https:\/\/widgets\.atomicskills\.academy\/calendar\?license=SECRET-LICENSE/);
  assert.match(emails[0]?.text ?? "", /https:\/\/widgets\.atomicskills\.academy\/deadline\?license=SECRET-LICENSE/);
  assert.match(emails[0]?.text ?? "", /https:\/\/widgets\.atomicskills\.academy\/clock\?license=SECRET-LICENSE/);
  assert.match(emails[0]?.html ?? "", /href="https:\/\/widgets\.atomicskills\.academy\/calendar\?license=SECRET-LICENSE"/);
  assert.match(emails[0]?.html ?? "", /href="https:\/\/widgets\.atomicskills\.academy\/deadline\?license=SECRET-LICENSE"/);
  assert.match(emails[0]?.html ?? "", /href="https:\/\/widgets\.atomicskills\.academy\/clock\?license=SECRET-LICENSE"/);
});

test("Gumroad webhook processor keeps calendar as the primary activation URL", async () => {
  const primaryActivationUrls: string[] = [];
  const processor = createGumroadWebhookProcessor({
    bundleProductId: "bundle-product",
    publicWidgetBaseUrl: "https://widgets.atomicskills.academy/",
    sendActivationEmail: async (email) => {
      primaryActivationUrls.push(email.activationUrl);
    },
  });

  assert.deepEqual(
    await processor.process({
      email: "buyer@example.com",
      license_key: "BUNDLE-LICENSE",
      product_id: "bundle-product",
      order_id: "order-123",
    }),
    { status: "sent" }
  );
  assert.deepEqual(primaryActivationUrls, [
    "https://widgets.atomicskills.academy/calendar?license=BUNDLE-LICENSE",
  ]);
});

test("Gumroad webhook processor rejects missing required purchase fields", async () => {
  const processor = createGumroadWebhookProcessor({
    bundleProductId: "bundle-product",
    publicWidgetBaseUrl: "https://widgets.atomicskills.academy",
    sendActivationEmail: async () => {
      throw new Error("should not send");
    },
  });

  assert.deepEqual(
    await processor.process({
      email: "buyer@example.com",
      product_id: "bundle-product",
      sale_id: "sale-123",
    }),
    {
      status: "invalid",
      reason: "license_key manquant",
    }
  );
});

test("Gumroad webhook processor rejects purchases from another product", async () => {
  const processor = createGumroadWebhookProcessor({
    bundleProductId: "bundle-product",
    publicWidgetBaseUrl: "https://widgets.atomicskills.academy",
    sendActivationEmail: async () => {
      throw new Error("should not send");
    },
  });

  assert.deepEqual(
    await processor.process({
      email: "buyer@example.com",
      license_key: "OTHER-LICENSE",
      product_id: "other-product",
      sale_id: "sale-456",
    }),
    {
      status: "invalid",
      reason: "produit Gumroad inconnu",
    }
  );
});

test("Gumroad webhook processor logs email errors without plaintext license values", async () => {
  const errors: string[] = [];
  const processor = createGumroadWebhookProcessor({
    bundleProductId: "bundle-product",
    publicWidgetBaseUrl: "https://widgets.atomicskills.academy",
    logger: {
      debug: () => undefined,
      info: () => undefined,
      warn: () => undefined,
      error: (message: string) => errors.push(message),
    },
    sendActivationEmail: async () => {
      throw new Error("SMTP down for SECRET-LICENSE");
    },
  });

  assert.deepEqual(
    await processor.process({
      email: "buyer@example.com",
      license_key: "SECRET-LICENSE",
      product_id: "bundle-product",
      sale_id: "sale-789",
    }),
    { status: "failed" }
  );
  assert.doesNotMatch(errors.join("\n"), /SECRET-LICENSE/);
  assert.match(errors.join("\n"), /license=/);
});

test("Gumroad webhook processor writes trace logs through debug without plaintext license values", async () => {
  const logs: string[] = [];
  const processor = createGumroadWebhookProcessor({
    bundleProductId: "bundle-product",
    publicWidgetBaseUrl: "https://widgets.atomicskills.academy",
    logger: {
      info: (message: string) => logs.push(message),
      warn: (message: string) => logs.push(message),
      error: (message: string) => logs.push(message),
      debug: (message: string) => logs.push(message),
    },
    sendActivationEmail: async () => undefined,
  });

  assert.deepEqual(
    await processor.process({
      email: "buyer@example.com",
      license_key: "SECRET-LICENSE",
      product_id: "bundle-product",
      sale_id: "sale-999",
    }),
    { status: "sent" }
  );

  const output = logs.join("\n");
  assert.match(output, /\[gumroad-webhook\] received/);
  assert.match(output, /\[gumroad-webhook\] accepted/);
  assert.match(output, /\[gumroad-webhook\] email send started/);
  assert.match(output, /\[gumroad-webhook\] email sent/);
  assert.doesNotMatch(output, /SECRET-LICENSE/);
  assert.doesNotMatch(output, /calendar\?license=/);
  assert.match(output, /license=sha256:/);
});
