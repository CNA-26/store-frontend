const fs = require("fs");
const path = require("path");

const DB_FILE = path.join(__dirname, "..", "..", "data", "orders.json");

function ensureDb() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ orders: [] }, null, 2), "utf8");
  }
}

function readDb() {
  ensureDb();
  const raw = fs.readFileSync(DB_FILE, "utf8");
  return JSON.parse(raw);
}

function writeDb(data) {
  ensureDb();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
}

function getAllOrders() {
  return readDb().orders;
}

function getOrderById(orderId) {
  return readDb().orders.find((o) => o.orderId === orderId) || null;
}

function getOrdersByEmail(email) {
  return readDb().orders.filter((o) => o.email === email);
}

function saveOrder(order) {
  const db = readDb();
  const existing = db.orders.findIndex((o) => o.orderId === order.orderId);
  if (existing >= 0) {
    db.orders[existing] = { ...db.orders[existing], ...order };
  } else {
    db.orders.push(order);
  }
  writeDb(db);
  return order;
}

function updateOrder(orderId, updates) {
  const db = readDb();
  const index = db.orders.findIndex((o) => o.orderId === orderId);
  if (index < 0) return null;
  db.orders[index] = { ...db.orders[index], ...updates };
  writeDb(db);
  return db.orders[index];
}

module.exports = { getAllOrders, getOrderById, getOrdersByEmail, saveOrder, updateOrder };
