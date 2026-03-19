// src/lib/email.ts
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
          href="${animationUrl}"
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
                  Hi ${greetingName},
                </p>

                <p style="margin:0 0 24px; font-size:18px; line-height:1.8; color:#475569;">
                  We’ve received your payment and your custom PurePaw bottle is now being prepared for dispatch.
                </p>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 26px; background:#faf7f2; border:1px solid #ebe4d8; border-radius:22px;">
                  <tr>
                    <td style="padding:22px 20px;">
                      <p style="margin:0 0 14px; font-size:14px; line-height:1.6; color:#64748b;">
                        <span style="display:block; font-size:12px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#a16207; margin-bottom:4px;">Order reference</span>
                        <span style="font-size:18px; font-weight:700; color:#0f172a;">${shortOrderId}</span>
                      </p>

                      <p style="margin:0 0 10px; font-size:16px; line-height:1.7; color:#334155;">
                        <strong style="color:#0f172a;">Product:</strong> ${productName}
                      </p>

                      <p style="margin:0; font-size:16px; line-height:1.7; color:#334155;">
                        <strong style="color:#0f172a;">Style:</strong> ${styleName}
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
                  Full order reference: ${orderId}
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