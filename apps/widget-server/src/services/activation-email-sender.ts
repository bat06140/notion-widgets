import { createRequire } from "node:module";
import type {
  ActivationEmail,
  SendActivationEmail,
} from "./gumroad-webhook-service.js";
import {
  createDebugLogger,
  type DebugLogger,
} from "../logging/license-debug.js";

const require = createRequire(import.meta.url);
const nodemailer = require("nodemailer") as {
  createTransport: (options: Record<string, unknown>) => {
    sendMail: (message: Record<string, unknown>) => Promise<unknown>;
  };
};

export type SmtpActivationEmailSenderOptions = {
  host?: string;
  port?: number;
  heloName?: string;
  fromEmail?: string;
  fromName?: string;
  connectionTimeoutMs?: number;
  greetingTimeoutMs?: number;
  socketTimeoutMs?: number;
  logger?: DebugLogger;
};

function formatFromAddress(fromEmail: string, fromName: string) {
  return fromName
    ? `"${fromName.replaceAll('"', '\\"')}" <${fromEmail}>`
    : fromEmail;
}

function numberFromEnv(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function countRecipients(value: unknown) {
  return Array.isArray(value) ? value.length : 0;
}

export function createSmtpActivationEmailSender({
  host = process.env.SMTP_RELAY_HOST ?? "smtp-relay.gmail.com",
  port = Number(process.env.SMTP_RELAY_PORT ?? 587),
  heloName = process.env.SMTP_HELO_NAME ?? "atomicskills.academy",
  fromEmail = process.env.SMTP_FROM_EMAIL ?? "",
  fromName = process.env.SMTP_FROM_NAME ?? "Atomic Skills",
  connectionTimeoutMs = numberFromEnv(
    process.env.SMTP_CONNECTION_TIMEOUT_MS,
    10_000,
  ),
  greetingTimeoutMs = numberFromEnv(process.env.SMTP_GREETING_TIMEOUT_MS, 10_000),
  socketTimeoutMs = numberFromEnv(process.env.SMTP_SOCKET_TIMEOUT_MS, 20_000),
  logger,
}: SmtpActivationEmailSenderOptions = {}): SendActivationEmail {
  const debugLogger = createDebugLogger(logger);
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: false,
    requireTLS: true,
    tls: {
      minVersion: "TLSv1.2",
    },
    connectionTimeout: connectionTimeoutMs,
    greetingTimeout: greetingTimeoutMs,
    socketTimeout: socketTimeoutMs,
    name: heloName,
  });

  return async function sendActivationEmail(email: ActivationEmail) {
    if (!fromEmail) {
      debugLogger.error("[activation-email] SMTP_FROM_EMAIL missing");
      throw new Error("SMTP_FROM_EMAIL manquant");
    }

    debugLogger.debug(
      [
        "[activation-email] smtp send",
        `host=${host}`,
        `port=${port}`,
        `helo=${heloName || "missing"}`,
        `from=${fromEmail ? "set" : "missing"}`,
        `to=${email.to ? "set" : "missing"}`,
        `connectionTimeoutMs=${connectionTimeoutMs}`,
        `greetingTimeoutMs=${greetingTimeoutMs}`,
        `socketTimeoutMs=${socketTimeoutMs}`,
      ].join(" "),
    );

    const result = (await transporter.sendMail({
      from: formatFromAddress(fromEmail, fromName),
      to: email.to,
      envelope: {
        from: fromEmail,
        to: email.to,
      },
      subject: email.subject,
      text: email.text,
      html: email.html,
    })) as {
      accepted?: unknown;
      rejected?: unknown;
      pending?: unknown;
      messageId?: unknown;
      response?: unknown;
    };

    debugLogger.debug(
      [
        "[activation-email] smtp result",
        `accepted=${countRecipients(result.accepted)}`,
        `rejected=${countRecipients(result.rejected)}`,
        `pending=${countRecipients(result.pending)}`,
        `messageId=${result.messageId ? "set" : "missing"}`,
        `response=${result.response ? "set" : "missing"}`,
      ].join(" "),
    );
  };
}
