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
  fromEmail?: string;
  fromName?: string;
  logger?: DebugLogger;
};

function formatFromAddress(fromEmail: string, fromName: string) {
  return fromName
    ? `"${fromName.replaceAll('"', '\\"')}" <${fromEmail}>`
    : fromEmail;
}

export function createSmtpActivationEmailSender({
  host = process.env.SMTP_RELAY_HOST ?? "smtp-relay.gmail.com",
  port = Number(process.env.SMTP_RELAY_PORT ?? 587),
  fromEmail = process.env.SMTP_FROM_EMAIL ?? "",
  fromName = process.env.SMTP_FROM_NAME ?? "Atomic Skills",
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
    name: "atomicskills.academy",
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
        `from=${fromEmail ? "set" : "missing"}`,
        `to=${email.to ? "set" : "missing"}`,
      ].join(" "),
    );

    await transporter.sendMail({
      from: formatFromAddress(fromEmail, fromName),
      to: email.to,
      subject: email.subject,
      text: email.text,
      html: email.html,
    });
  };
}
