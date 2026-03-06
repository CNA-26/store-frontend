# Order Service

A lightweight Node.js/Express API for managing orders and sending email notifications for the Monstera store.

## Getting Started

```bash
cd order-service
npm install
cp .env.example .env   # Edit .env with your SMTP credentials
npm start
```

The service will start on **http://localhost:3001** by default.

## Authentication

All `/orders` endpoints require an `X-API-Key` header:

```
X-API-Key: 9f2c8a7b4e6d1f3c9a0b2d4e6f8a1c3e5b7d9f2c4a6e8b0d1c3f5a7e9b2d4c6
```

Set a custom key via the `API_KEY` environment variable.

## API Endpoints

Base URL: `{host}/orders`

### POST /orders/order
Create a new order and send a confirmation email to the customer.

```json
{
  "email": "test@example.com",
  "orderId": "123abc",
  "items": [
    { "name": "Product 1", "quantity": 2, "price": 10 },
    { "name": "Product 2", "quantity": 1, "price": 15 }
  ]
}
```

Response `201`:
```json
{
  "message": "Order created",
  "orderId": "123abc",
  "order": { ... }
}
```

### POST /orders/invoice
Send an invoice email to the customer.

```json
{
  "email": "test@example.com",
  "invoiceId": "INV-12345",
  "amount": 20.00
}
```

Response `200`:
```json
{ "message": "Invoice email sent", "invoiceId": "INV-12345" }
```

### POST /orders/shipping
Update an order's status to shipped and send a shipping notification email.

```json
{
  "email": "test@example.com",
  "orderId": "12345",
  "trackingNumber": "TRK-12345"
}
```

Response `200`:
```json
{ "message": "Shipping notification sent", "orderId": "12345", "trackingNumber": "TRK-12345" }
```

### GET /orders
Retrieve all orders.

```
GET /orders
GET /orders?email=test@example.com
```

Response `200`:
```json
{ "orders": [ ... ] }
```

### GET /orders/:orderId
Retrieve a single order by ID.

Response `200`:
```json
{ "order": { ... } }
```

## Data Storage

Orders are persisted in `order-service/data/orders.json`. This file is created automatically on first run.

## Email Configuration

Emails are sent via the external email service at `https://email-service-cna-2026.2.rahtiapp.fi`. Configure the URL and API key via environment variables (see `.env.example`).

| Variable | Default |
|---|---|
| `EMAIL_SERVICE_URL` | `https://email-service-cna-2026.2.rahtiapp.fi` |
| `EMAIL_SERVICE_API_KEY` | falls back to `API_KEY` |
