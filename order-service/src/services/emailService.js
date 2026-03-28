const EMAIL_SERVICE_URL =
  (process.env.EMAIL_SERVICE_URL || "https://email-service-cna-2026.2.rahtiapp.fi").replace(/\/$/, "");
const EMAIL_SERVICE_API_KEY =
  process.env.EMAIL_SERVICE_API_KEY ||
  process.env.API_KEY ||
  "9f2c8a7b4e6d1f3c9a0b2d4e6f8a1c3e5b7d9f2c4a6e8b0d1c3f5a7e9b2d4c6";

async function callEmailService(path, body) {
  const url = `${EMAIL_SERVICE_URL}/${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": EMAIL_SERVICE_API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Email service responded with ${res.status}: ${text}`);
  }

  return res.json().catch(() => ({}));
}

async function sendOrderConfirmation({ email, orderId, items }) {
  return callEmailService("order", { email, orderId, items });
}

async function sendInvoiceNotification({ email, invoiceId, amount }) {
  return callEmailService("invoice", { email, invoiceId, amount });
}

async function sendShippingNotification({ email, orderId, trackingNumber }) {
  return callEmailService("shipping", { email, orderId, trackingNumber });
}

module.exports = { sendOrderConfirmation, sendInvoiceNotification, sendShippingNotification };

