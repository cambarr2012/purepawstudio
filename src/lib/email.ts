import { Resend } from "resend";

type EmailTemplateArgs = {
  firstName?: string | null;
  orderId: string;
  productType?: string | null;
  styleId?: string | null;
  animationUrl?: string | null;
};

type SendOrderConfirmationEmailArgs = EmailTemplateArgs & {
  to: string;
};

type ShippingAddress = {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
};

type SendInternalOrderAlertEmailArgs = {
  to: string;
  orderId: string;
  firstName?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  productType?: string | null;
  styleId?: string | null;
  animationUrl?: string | null;
  amountTotal?: number | null;
  currency?: string | null;
  stripeSessionId?: string | null;
  paymentIntentId?: string | null;
  artworkId?: string | null;
  artworkUrl?: string | null;
  printFileUrl?: string | null;
  shippingName?: string | null;
  shippingAddress?: ShippingAddress | null;
};

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  return new Resend(apiKey);
}

function formatProductName(productType?: string | null) {
  if (productType === "gym_bottle") return "PurePaw Gym Bottle";
  return "PurePaw Flask";
}

function formatStyleName(styleId?: string | null) {
  if (!styleId) return "Custom";

  return styleId
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function shortenOrderId(orderId: string) {
  if (!orderId) return "";
  if (orderId.length <= 18) return orderId;
  return `${orderId.slice(0, 8)}...${orderId.slice(-6)}`;
}

function formatCurrencyAmount(
  amountTotal?: number | null,
  currency?: string | null
) {
  if (typeof amountTotal !== "number") return "Unknown";

  const resolvedCurrency = (currency || "GBP").toUpperCase();

  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: resolvedCurrency,
    }).format(amountTotal / 100);
  } catch {
    return `${(amountTotal / 100).toFixed(2)} ${resolvedCurrency}`;
  }
}

function formatAddressLines(address?: ShippingAddress | null) {
  if (!address) return [];

  return [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.postal_code,
    address.country,
  ].filter((value): value is string => !!value?.trim());
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function linkOrFallback(url?: string | null, fallback = "Not available") {
  if (!url) return fallback;
  const safeUrl = escapeHtml(url);
  return `<a href="${safeUrl}" style="color:#0f172a; text-decoration:underline;">${safeUrl}</a>`;
}

export function buildOrderConfirmationEmail({
  firstName,
  orderId,
  productType,
  styleId,
  animationUrl,
}: EmailTemplateArgs) {
  const productName = formatProductName(productType);
  const styleName = formatStyleName(styleId);
  const shortOrderId = shortenOrderId(orderId);
  const greetingName = firstName?.trim() || "there";
  const subject = "Your PurePaw order is confirmed";

  const bonusSection = animationUrl
    ? `
      <div style="margin:0 0 26px; padding:22px 20px; background:#fff7e8; border:1px solid #f3ddab; border-radius:22px;">
        <p style="margin:0 0 8px; font-size:18px; line-height:1.4; font-weight:700; color:#0f172a;">
          A little bonus
        </p>
        <p style="margin:0 0 16px; font-size:16px; line-height:1.8; color:#475569;">
          Your PurePaw animation is ready to view.
        </p>
        <a
          href="${escapeHtml(animationUrl)}"
          style="display:inline-block; padding:12px 18px; background:#0f172a; color:#ffffff; text-decoration:none; border-radius:999px; font-size:14px; font-weight:700;"
        >
          View your animation
        </a>
      </div>
    `
    : "";

  const textBonusSection = animationUrl
    ? ["", "A little bonus:", `View your animation: ${animationUrl}`].join("\n")
    : "";

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${subject}</title>
      </head>
      <body style="margin:0; padding:0; background-color:#f7f3ed; font-family:Inter, Arial, Helvetica, sans-serif; color:#0f172a;">
        <div style="margin:0; padding:32px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:640px; margin:0 auto;">
            <tr>
              <td align="center" style="padding-bottom:18px;">
                <img
                  src="https://purepawstudio.com/purepawstudio-logo.png"
                  alt="PurePaw Studio"
                  width="72"
                  height="72"
                  style="display:block; width:72px; height:72px; border-radius:20px; border:1px solid #e7dfd2;"
                />
              </td>
            </tr>

            <tr>
              <td align="center" style="padding-bottom:14px;">
                <div style="display:inline-block; padding:8px 14px; border:1px solid #f1c46a; border-radius:999px; background:#fff7e8; color:#a16207; font-size:11px; font-weight:700; letter-spacing:0.22em; text-transform:uppercase;">
                  Order confirmed
                </div>
              </td>
            </tr>

            <tr>
              <td style="background:#ffffff; border:1px solid #ebe4d8; border-radius:28px; padding:36px 28px; box-shadow:0 16px 40px rgba(15,23,42,0.05);">
                <div style="width:52px; height:52px; border-radius:999px; background:#ecfdf5; color:#059669; text-align:center; line-height:52px; font-size:26px; font-weight:700; margin-bottom:22px;">
                  ✓
                </div>

                <h1 style="margin:0 0 16px; font-size:36px; line-height:1.05; font-weight:800; color:#020617;">
                  Thanks for your order
                </h1>

                <p style="margin:0 0 18px; font-size:18px; line-height:1.7; color:#475569;">
                  Hi ${escapeHtml(greetingName)},
                </p>

                <p style="margin:0 0 24px; font-size:18px; line-height:1.8; color:#475569;">
                  We’ve received your payment and your custom PurePaw bottle is now being prepared for dispatch.
                </p>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 26px; background:#faf7f2; border:1px solid #ebe4d8; border-radius:22px;">
                  <tr>
                    <td style="padding:22px 20px;">
                      <p style="margin:0 0 14px; font-size:14px; line-height:1.6; color:#64748b;">
                        <span style="display:block; font-size:12px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#a16207; margin-bottom:4px;">Order reference</span>
                        <span style="font-size:18px; font-weight:700; color:#0f172a;">${escapeHtml(shortOrderId)}</span>
                      </p>

                      <p style="margin:0 0 10px; font-size:16px; line-height:1.7; color:#334155;">
                        <strong style="color:#0f172a;">Product:</strong> ${escapeHtml(productName)}
                      </p>

                      <p style="margin:0; font-size:16px; line-height:1.7; color:#334155;">
                        <strong style="color:#0f172a;">Style:</strong> ${escapeHtml(styleName)}
                      </p>
                    </td>
                  </tr>
                </table>

                ${bonusSection}

                <h2 style="margin:0 0 12px; font-size:20px; line-height:1.3; font-weight:700; color:#0f172a;">
                  What happens next
                </h2>

                <p style="margin:0 0 10px; font-size:16px; line-height:1.8; color:#475569;">
                  We’ll send another email once your order has been dispatched.
                </p>

                <p style="margin:0 0 28px; font-size:16px; line-height:1.8; color:#475569;">
                  If you need help in the meantime, just reply to this email and we’ll be happy to help.
                </p>

                <div style="margin-top:8px; padding-top:22px; border-top:1px solid #eee7db;">
                  <p style="margin:0; font-size:16px; line-height:1.8; color:#475569;">
                    Thanks again,<br />
                    <span style="font-weight:700; color:#0f172a;">PurePaw Studio</span>
                  </p>
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:18px 10px 0; text-align:center;">
                <p style="margin:0; font-size:13px; line-height:1.7; color:#78716c;">
                  Support:
                  <a href="mailto:support@purepawstudio.com" style="color:#0f172a; text-decoration:underline;">
                    support@purepawstudio.com
                  </a>
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:8px 10px 0; text-align:center;">
                <p style="margin:0; font-size:12px; line-height:1.7; color:#a8a29e;">
                  Full order reference: ${escapeHtml(orderId)}
                </p>
              </td>
            </tr>
          </table>
        </div>
      </body>
    </html>
  `;

  const text = [
    "Thanks for your order",
    "",
    `Hi ${greetingName},`,
    "",
    "We’ve received your payment and your custom PurePaw bottle is now being prepared for dispatch.",
    "",
    `Order reference: ${orderId}`,
    `Product: ${productName}`,
    `Style: ${styleName}`,
    textBonusSection,
    "",
    "What happens next:",
    "We’ll send another email once your order has been dispatched.",
    "If you need help in the meantime, just reply to this email.",
    "",
    "Thanks again,",
    "PurePaw Studio",
    "support@purepawstudio.com",
  ].join("\n");

  return { subject, html, text };
}

export function buildInternalOrderAlertEmail({
  orderId,
  customerName,
  customerEmail,
  productType,
  styleId,
  animationUrl,
  amountTotal,
  currency,
  stripeSessionId,
  paymentIntentId,
  artworkId,
  artworkUrl,
  printFileUrl,
  shippingName,
  shippingAddress,
}: Omit<SendInternalOrderAlertEmailArgs, "to" | "firstName">) {
  const productName = formatProductName(productType);
  const styleName = formatStyleName(styleId);
  const formattedAmount = formatCurrencyAmount(amountTotal, currency);
  const addressLines = formatAddressLines(shippingAddress);
  const subject = `New PurePaw Order – ${orderId} – ${styleName} ${productName}`;

  const htmlAddress =
    addressLines.length > 0
      ? addressLines.map((line) => escapeHtml(line)).join("<br />")
      : "Not provided";

  const textAddress =
    addressLines.length > 0 ? addressLines.join(", ") : "Not provided";

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(subject)}</title>
      </head>
      <body style="margin:0; padding:0; background-color:#f7f3ed; font-family:Inter, Arial, Helvetica, sans-serif; color:#0f172a;">
        <div style="margin:0; padding:32px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:720px; margin:0 auto;">
            <tr>
              <td style="background:#ffffff; border:1px solid #ebe4d8; border-radius:28px; padding:32px 28px; box-shadow:0 16px 40px rgba(15,23,42,0.05);">
                <div style="display:inline-block; padding:8px 14px; border:1px solid #d6d3d1; border-radius:999px; background:#faf7f2; color:#44403c; font-size:11px; font-weight:700; letter-spacing:0.22em; text-transform:uppercase; margin-bottom:16px;">
                  New order alert
                </div>

                <h1 style="margin:0 0 20px; font-size:30px; line-height:1.1; font-weight:800; color:#020617;">
                  New PurePaw order received
                </h1>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px; background:#faf7f2; border:1px solid #ebe4d8; border-radius:22px;">
                  <tr>
                    <td style="padding:22px 20px;">
                      <p style="margin:0 0 10px; font-size:16px; line-height:1.7; color:#334155;">
                        <strong style="color:#0f172a;">Order ID:</strong> ${escapeHtml(orderId)}
                      </p>
                      <p style="margin:0 0 10px; font-size:16px; line-height:1.7; color:#334155;">
                        <strong style="color:#0f172a;">Amount:</strong> ${escapeHtml(formattedAmount)}
                      </p>
                      <p style="margin:0 0 10px; font-size:16px; line-height:1.7; color:#334155;">
                        <strong style="color:#0f172a;">Product:</strong> ${escapeHtml(productName)}
                      </p>
                      <p style="margin:0; font-size:16px; line-height:1.7; color:#334155;">
                        <strong style="color:#0f172a;">Style:</strong> ${escapeHtml(styleName)}
                      </p>
                    </td>
                  </tr>
                </table>

                <h2 style="margin:0 0 12px; font-size:20px; line-height:1.3; font-weight:700; color:#0f172a;">
                  Customer
                </h2>

                <p style="margin:0 0 8px; font-size:16px; line-height:1.8; color:#475569;">
                  <strong style="color:#0f172a;">Name:</strong> ${escapeHtml(customerName || "Not provided")}
                </p>
                <p style="margin:0 0 24px; font-size:16px; line-height:1.8; color:#475569;">
                  <strong style="color:#0f172a;">Email:</strong> ${escapeHtml(customerEmail || "Not provided")}
                </p>

                <h2 style="margin:0 0 12px; font-size:20px; line-height:1.3; font-weight:700; color:#0f172a;">
                  Delivery
                </h2>

                <p style="margin:0 0 8px; font-size:16px; line-height:1.8; color:#475569;">
                  <strong style="color:#0f172a;">Recipient:</strong> ${escapeHtml(shippingName || "Not provided")}
                </p>
                <p style="margin:0 0 24px; font-size:16px; line-height:1.8; color:#475569;">
                  <strong style="color:#0f172a;">Address:</strong><br />
                  ${htmlAddress}
                </p>

                <h2 style="margin:0 0 12px; font-size:20px; line-height:1.3; font-weight:700; color:#0f172a;">
                  Production
                </h2>

                <p style="margin:0 0 8px; font-size:15px; line-height:1.8; color:#475569;">
                  <strong style="color:#0f172a;">Artwork ID:</strong> ${escapeHtml(artworkId || "Not available")}
                </p>
                <p style="margin:0 0 8px; font-size:15px; line-height:1.8; color:#475569;">
                  <strong style="color:#0f172a;">Artwork URL:</strong> ${linkOrFallback(artworkUrl)}
                </p>
                <p style="margin:0 0 8px; font-size:15px; line-height:1.8; color:#475569;">
                  <strong style="color:#0f172a;">Print file URL:</strong> ${linkOrFallback(printFileUrl)}
                </p>
                <p style="margin:0 0 24px; font-size:15px; line-height:1.8; color:#475569;">
                  <strong style="color:#0f172a;">Animation URL:</strong> ${linkOrFallback(animationUrl, "None")}
                </p>

                <h2 style="margin:0 0 12px; font-size:20px; line-height:1.3; font-weight:700; color:#0f172a;">
                  Payment / Stripe
                </h2>

                <p style="margin:0 0 8px; font-size:15px; line-height:1.8; color:#475569;">
                  <strong style="color:#0f172a;">Stripe Session ID:</strong> ${escapeHtml(stripeSessionId || "Not available")}
                </p>
                <p style="margin:0; font-size:15px; line-height:1.8; color:#475569;">
                  <strong style="color:#0f172a;">Payment Intent ID:</strong> ${escapeHtml(paymentIntentId || "Not available")}
                </p>
              </td>
            </tr>
          </table>
        </div>
      </body>
    </html>
  `;

  const text = [
    "New PurePaw order received",
    "",
    `Order ID: ${orderId}`,
    `Amount: ${formattedAmount}`,
    `Product: ${productName}`,
    `Style: ${styleName}`,
    "",
    "Customer",
    `Name: ${customerName || "Not provided"}`,
    `Email: ${customerEmail || "Not provided"}`,
    "",
    "Delivery",
    `Recipient: ${shippingName || "Not provided"}`,
    `Address: ${textAddress}`,
    "",
    "Production",
    `Artwork ID: ${artworkId || "Not available"}`,
    `Artwork URL: ${artworkUrl || "Not available"}`,
    `Print file URL: ${printFileUrl || "Not available"}`,
    `Animation URL: ${animationUrl || "None"}`,
    "",
    "Payment / Stripe",
    `Stripe Session ID: ${stripeSessionId || "Not available"}`,
    `Payment Intent ID: ${paymentIntentId || "Not available"}`,
  ].join("\n");

  return { subject, html, text };
}

export async function sendOrderConfirmationEmail({
  to,
  firstName,
  orderId,
  productType,
  styleId,
  animationUrl,
}: SendOrderConfirmationEmailArgs) {
  const resend = getResendClient();

  const { subject, html, text } = buildOrderConfirmationEmail({
    firstName,
    orderId,
    productType,
    styleId,
    animationUrl,
  });

  return resend.emails.send({
    from:
      process.env.EMAIL_FROM ||
      "PurePaw Studio <support@purepawstudio.com>",
    replyTo: process.env.EMAIL_REPLY_TO || "support@purepawstudio.com",
    to,
    subject,
    html,
    text,
  });
}

export async function sendInternalOrderAlertEmail({
  to,
  orderId,
  customerName,
  customerEmail,
  productType,
  styleId,
  animationUrl,
  amountTotal,
  currency,
  stripeSessionId,
  paymentIntentId,
  artworkId,
  artworkUrl,
  printFileUrl,
  shippingName,
  shippingAddress,
}: SendInternalOrderAlertEmailArgs) {
  const resend = getResendClient();

  const { subject, html, text } = buildInternalOrderAlertEmail({
    orderId,
    customerName,
    customerEmail,
    productType,
    styleId,
    animationUrl,
    amountTotal,
    currency,
    stripeSessionId,
    paymentIntentId,
    artworkId,
    artworkUrl,
    printFileUrl,
    shippingName,
    shippingAddress,
  });

  return resend.emails.send({
    from:
      process.env.EMAIL_FROM ||
      "PurePaw Studio <support@purepawstudio.com>",
    replyTo: process.env.EMAIL_REPLY_TO || "support@purepawstudio.com",
    to,
    subject,
    html,
    text,
  });
}