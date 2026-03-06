const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { requireApiKey } = require("../middleware/auth");
const { getAllOrders, getOrderById, getOrdersByEmail, saveOrder, updateOrder } = require("../db/database");
const { sendOrderConfirmation, sendInvoiceNotification, sendShippingNotification } = require("../services/emailService");

const router = express.Router();

router.use(requireApiKey);

/**
 * POST /orders/order
 * Create a new order and send a confirmation email.
 *
 * Body: { email, orderId?, items: [{ name, quantity, price }] }
 */
router.post("/order", async (req, res) => {
  const { email, orderId, items } = req.body;

  if (!email || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "email and items are required" });
  }

  for (const item of items) {
    if (!item.name || typeof item.quantity !== "number" || typeof item.price !== "number") {
      return res.status(400).json({ error: "Each item must have name, quantity (number), and price (number)" });
    }
  }

  const resolvedOrderId = orderId || uuidv4();

  const order = {
    orderId: resolvedOrderId,
    email,
    items,
    status: "confirmed",
    createdAt: new Date().toISOString(),
  };

  saveOrder(order);

  try {
    await sendOrderConfirmation({ email, orderId: resolvedOrderId, items });
  } catch (err) {
    console.error("[email] Failed to send order confirmation:", err.message);
  }

  res.status(201).json({ message: "Order created", orderId: resolvedOrderId, order });
});

/**
 * POST /orders/invoice
 * Send an invoice notification email.
 *
 * Body: { email, invoiceId, amount }
 */
router.post("/invoice", async (req, res) => {
  const { email, invoiceId, amount } = req.body;

  if (!email || !invoiceId || amount === undefined) {
    return res.status(400).json({ error: "email, invoiceId, and amount are required" });
  }

  if (isNaN(Number(amount))) {
    return res.status(400).json({ error: "amount must be a number" });
  }

  try {
    await sendInvoiceNotification({ email, invoiceId, amount: Number(amount) });
  } catch (err) {
    console.error("[email] Failed to send invoice notification:", err.message);
    return res.status(500).json({ error: "Failed to send invoice email" });
  }

  res.json({ message: "Invoice email sent", invoiceId });
});

/**
 * POST /orders/shipping
 * Send a shipping notification email and update the order status.
 *
 * Body: { email, orderId, trackingNumber }
 */
router.post("/shipping", async (req, res) => {
  const { email, orderId, trackingNumber } = req.body;

  if (!email || !orderId || !trackingNumber) {
    return res.status(400).json({ error: "email, orderId, and trackingNumber are required" });
  }

  const updated = updateOrder(orderId, { status: "shipped", trackingNumber, shippedAt: new Date().toISOString() });
  if (!updated) {
    console.warn(`[orders] Shipping update: order ${orderId} not found in local store`);
  }

  try {
    await sendShippingNotification({ email, orderId, trackingNumber });
  } catch (err) {
    console.error("[email] Failed to send shipping notification:", err.message);
  }

  res.json({ message: "Shipping notification sent", orderId, trackingNumber });
});

/**
 * GET /orders
 * Retrieve all orders, or filter by email: /orders?email=user@example.com
 */
router.get("/", (req, res) => {
  const { email } = req.query;
  const orders = email ? getOrdersByEmail(email) : getAllOrders();
  res.json({ orders });
});

/**
 * GET /orders/:orderId
 * Retrieve a single order by ID.
 */
router.get("/:orderId", (req, res) => {
  const order = getOrderById(req.params.orderId);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }
  res.json({ order });
});

module.exports = router;
