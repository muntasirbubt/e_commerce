import nodemailer, { type Transporter } from "nodemailer";
import { getStoreSettings } from "@/lib/config";

/**
 * Transactional email helper.
 *
 * Configure with SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and MAIL_FROM.
 * When SMTP_HOST is not set, emails are logged to the console instead of sent,
 * so local development and checkout never fail because mail is unconfigured.
 * Sending errors are logged and swallowed: an email failure must never break
 * an order, registration, or status update.
 */

let transporter: Transporter | null | undefined;

function getTransporter() {
  if (transporter !== undefined) return transporter;
  if (!process.env.SMTP_HOST) return (transporter = null);
  const port = Number(process.env.SMTP_PORT ?? 587);
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  return transporter;
}

export function appUrl(path = "") {
  return `${(process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "")}${path}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function layout(storeName: string, heading: string, bodyHtml: string, cta?: { label: string; href: string }) {
  return `<!doctype html><html><body style="margin:0;background:#f3f6f1;font-family:Helvetica,Arial,sans-serif;color:#304536">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden">
<tr><td style="background:#1b3b2b;color:#ffffff;padding:22px 32px;font-family:Georgia,serif;font-size:20px">${escapeHtml(storeName)}</td></tr>
<tr><td style="padding:32px">
<h1 style="margin:0 0 16px;font-family:Georgia,serif;font-weight:normal;font-size:26px;color:#1b3b2b">${escapeHtml(heading)}</h1>
<div style="font-size:14px;line-height:1.6">${bodyHtml}</div>
${cta ? `<p style="margin:28px 0 0"><a href="${cta.href}" style="display:inline-block;background:#1b3b2b;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:999px;font-size:14px">${escapeHtml(cta.label)}</a></p>` : ""}
</td></tr>
<tr><td style="padding:18px 32px;background:#f8faf7;font-size:11px;color:#8a948b">You received this email because of activity on your ${escapeHtml(storeName)} account or order.</td></tr>
</table></td></tr></table></body></html>`;
}

export async function sendMail({ to, subject, html, text }: { to: string; subject: string; html: string; text: string }) {
  try {
    const settings = await getStoreSettings();
    const from = process.env.MAIL_FROM ?? `${settings.storeName} <${settings.supportEmail || "no-reply@localhost"}>`;
    const t = getTransporter();
    if (!t) {
      console.info(`[mail:dev] To: ${to} | Subject: ${subject}\n${text}`);
      return;
    }
    await t.sendMail({ from, to, subject, html, text });
  } catch (error) {
    console.error("[mail] Failed to send email", { to, subject, error });
  }
}

type OrderForMail = {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number | { toString(): string };
  shippingAmount: number | { toString(): string };
  discountAmount: number | { toString(): string };
  items: { quantity: number; price: number | { toString(): string }; title: string; sku: string }[];
};

const money = (currency: string, value: number | { toString(): string }) =>
  `${currency} ${Number(value).toFixed(2)}`;

export async function sendOrderConfirmation(order: OrderForMail) {
  const { storeName, currency } = await getStoreSettings();
  const rows = order.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0">${escapeHtml(i.title)} <span style="color:#8a948b">× ${i.quantity}</span></td><td align="right">${money(currency, Number(i.price) * i.quantity)}</td></tr>`,
    )
    .join("");
  const html = layout(
    storeName,
    `Thank you, ${order.customerName.split(" ")[0]}.`,
    `<p>We've received your order <strong>${escapeHtml(order.orderNumber)}</strong> and will let you know when it's on its way.</p>
<table width="100%" style="margin-top:16px;border-top:1px solid #e3e9e1;font-size:13px">${rows}
<tr><td style="padding-top:10px;color:#738075">Shipping</td><td align="right" style="padding-top:10px">${Number(order.shippingAmount) === 0 ? "Free" : money(currency, order.shippingAmount)}</td></tr>
${Number(order.discountAmount) > 0 ? `<tr><td style="color:#4b6e52">Discount</td><td align="right" style="color:#4b6e52">− ${money(currency, order.discountAmount)}</td></tr>` : ""}
<tr><td style="padding-top:8px;font-weight:bold">Total</td><td align="right" style="padding-top:8px;font-weight:bold">${money(currency, order.totalAmount)}</td></tr></table>`,
    { label: "View your orders", href: appUrl("/account/orders") },
  );
  const text = `Thank you for your order ${order.orderNumber}.\n${order.items
    .map((i) => `${i.title} x ${i.quantity}`)
    .join("\n")}\nTotal: ${money(currency, order.totalAmount)}`;
  await sendMail({ to: order.customerEmail, subject: `Order ${order.orderNumber} confirmed`, html, text });
}

const statusCopy: Partial<Record<string, { subject: string; heading: string; body: string }>> = {
  PROCESSING: {
    subject: "is being prepared",
    heading: "We're preparing your order",
    body: "Your order is confirmed and our team is getting it ready.",
  },
  SHIPPED: {
    subject: "is on its way",
    heading: "Your order has shipped",
    body: "Good news — your order has left us and is on its way to you.",
  },
  DELIVERED: {
    subject: "has been delivered",
    heading: "Your order has arrived",
    body: "Your order has been delivered. We hope you love it — reviews help others find their fit.",
  },
  CANCELLED: {
    subject: "has been cancelled",
    heading: "Your order was cancelled",
    body: "Your order has been cancelled. If this is unexpected, just reply to this email.",
  },
};

export async function sendOrderStatusUpdate(order: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: string;
}) {
  const copy = statusCopy[order.status];
  if (!copy) return;
  const { storeName } = await getStoreSettings();
  const html = layout(
    storeName,
    copy.heading,
    `<p>Hi ${escapeHtml(order.customerName.split(" ")[0])},</p><p>${copy.body}</p><p>Order reference: <strong>${escapeHtml(order.orderNumber)}</strong></p>`,
    { label: "View order", href: appUrl("/account/orders") },
  );
  await sendMail({
    to: order.customerEmail,
    subject: `Order ${order.orderNumber} ${copy.subject}`,
    html,
    text: `${copy.body}\nOrder: ${order.orderNumber}`,
  });
}

export async function sendWelcomeEmail(user: { name: string; email: string }) {
  const { storeName } = await getStoreSettings();
  const html = layout(
    storeName,
    `Welcome, ${user.name.split(" ")[0]}.`,
    `<p>Your ${escapeHtml(storeName)} account is ready. Track orders, leave reviews, and check out faster next time.</p>`,
    { label: "Start shopping", href: appUrl("/shop") },
  );
  await sendMail({
    to: user.email,
    subject: `Welcome to ${storeName}`,
    html,
    text: `Welcome to ${storeName}! Start shopping: ${appUrl("/shop")}`,
  });
}

export async function sendPasswordResetEmail(user: { name: string | null; email: string }, resetUrl: string) {
  const { storeName } = await getStoreSettings();
  const html = layout(
    storeName,
    "Reset your password",
    `<p>Hi ${escapeHtml(user.name?.split(" ")[0] ?? "there")},</p><p>We received a request to reset your password. This link expires in 1 hour and can be used once.</p><p style="color:#8a948b;font-size:12px">If you didn't ask for this, you can safely ignore this email.</p>`,
    { label: "Choose a new password", href: resetUrl },
  );
  await sendMail({
    to: user.email,
    subject: `Reset your ${storeName} password`,
    html,
    text: `Reset your password (expires in 1 hour): ${resetUrl}`,
  });
}
