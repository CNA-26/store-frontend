import { useMemo, useState } from "react";
import { useCart } from "../contexts/CartContext";
import { Link } from "react-router-dom";

const BASE_URL = "https://order-service-git-order-service.2.rahtiapp.fi";
const API_KEY = "sprint3secret";

type Delivery = "pickup" | "posti" | "home";
type Payment = "card" | "bank" | "mobilepay" | "invoice";

interface OrderData {
  customer: {
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
  };
  delivery: {
    method: Delivery;
    address: {
      street: string;
      postalCode: string;
      city: string;
    };
  };
  payment: {
    method: Payment;
  };
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  totals: {
    subtotal: number;
    deliveryCost: number;
    total: number;
  };
  timestamp: string;
  acceptedTerms: boolean;
}

// Helper function to safely parse JSON responses
async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export default function CheckoutPage() {
  const { cart, removeFromCart, clearCart } = useCart();

  const items = cart;

  // Form state
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [street, setStreet] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [delivery, setDelivery] = useState<Delivery>("posti");
  const [payment, setPayment] = useState<Payment>("bank");
  const [accept, setAccept] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const subtotal = useMemo(() => items.reduce((s, it) => s + it.price * it.qty, 0), [items]);

  const deliveryCost = useMemo(() => {
    if (delivery === "pickup") return 0;
    if (delivery === "posti") return 4.9; 
    return 9.9; 
  }, [delivery]);

  const total = subtotal + deliveryCost;

  // Validation
  const isFormValid = () => {
    return (
      email.trim() &&
      phone.trim() &&
      firstName.trim() &&
      lastName.trim() &&
      street.trim() &&
      postalCode.trim() &&
      city.trim() &&
      accept &&
      items.length > 0
    );
  };

  // Handle order submission
  const handlePlaceOrder = async () => {
    if (!isFormValid()) {
      setSubmitMessage({ type: "error", text: "Please fill in all fields and accept terms." });
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      // Build order data
      const orderData: OrderData = {
        customer: {
          email,
          phone,
          firstName,
          lastName,
        },
        delivery: {
          method: delivery,
          address: {
            street,
            postalCode,
            city,
          },
        },
        payment: {
          method: payment,
        },
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.qty,
        })),
        totals: {
          subtotal,
          deliveryCost,
          total,
        },
        timestamp: new Date().toISOString(),
        acceptedTerms: true,
      };

      // Call the actual API endpoint
      const apiResponse = await fetch(`${BASE_URL}/api/v1/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": API_KEY,
        },
        body: JSON.stringify(orderData),
      });

      const response = await safeJson(apiResponse);
      
      if (!apiResponse.ok) {
        const msg = typeof response === "string" 
          ? response 
          : (response?.error || response?.message || JSON.stringify(response));
        throw new Error(`API error (${apiResponse.status}): ${msg}`);
      }
      
      // Log the order data for debugging (can be removed later)
      console.log("Order placed successfully:", response);
      
      // Clear cart and show success message
      clearCart();
      setSubmitMessage({ 
        type: "success", 
        text: `Order placed successfully! Order ID: ${response?.data?.id || response?.orderId || "pending"}`
      });

      // Reset form
      setTimeout(() => {
        setEmail("");
        setPhone("");
        setFirstName("");
        setLastName("");
        setStreet("");
        setPostalCode("");
        setCity("");
        setDelivery("posti");
        setPayment("bank");
        setAccept(false);
        setSubmitMessage(null);
      }, 2000);
    } catch (error) {
      console.error("Order submission error:", error);
      setSubmitMessage({ 
        type: "error", 
        text: error instanceof Error ? error.message : "Failed to place order. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-monstera-light">
      {}
      <header className="bg-monstera-dark shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <h1 className="font-lemonfunky text-5xl md:text-6xl text-monstera-lime text-center">
            Monstera
          </h1>
          <p className="mt-3 text-center text-monstera-light text-lg">
            Checkout
          </p>
          <div className="mt-4 text-center">
            <Link to="/">
              <button className="bg-monstera-lime hover:bg-monstera-brown text-monstera-dark font-bold py-2 px-4 rounded-full">
                Back to homepage
              </button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* LEFT */}
          <div className="space-y-6 lg:col-span-2">
            <Section title="Customer details">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Email">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-monstera-lime focus:outline-none focus:border-monstera-green text-monstera-dark"
                    placeholder="name@example.com"
                  />
                </Field>
                <Field label="Phone (Finland format)">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-monstera-lime focus:outline-none focus:border-monstera-green text-monstera-dark"
                    placeholder="+358 40 123 4567"
                  />
                </Field>

                <Field label="First name">
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-monstera-lime focus:outline-none focus:border-monstera-green text-monstera-dark"
                  />
                </Field>
                <Field label="Last name">
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-monstera-lime focus:outline-none focus:border-monstera-green text-monstera-dark"
                  />
                </Field>
              </div>
            </Section>

            <Section title="Delivery">
              <div className="grid gap-4">
                <RadioCard
                  title="Posti / pickup point (recommended)"
                  desc="Parcel locker or pickup point (mock selector)"
                  checked={delivery === "posti"}
                  onClick={() => setDelivery("posti")}
                />
                {delivery === "posti" && (
                  <div className="rounded-xl bg-white p-4 border-2 border-monstera-green">
                    <p className="font-bold text-monstera-dark">Pickup point</p>
                    <p className="text-monstera-brown text-sm mt-1">
                      Placeholder: later you can add a pickup-point search/map.
                    </p>
                    <button
                      type="button"
                      className="mt-3 bg-monstera-lime hover:bg-monstera-brown text-monstera-dark hover:text-white font-bold py-2 px-5 rounded-full transition duration-300"
                    >
                      Select pickup point
                    </button>
                  </div>
                )}

                <RadioCard
                  title="Home delivery"
                  desc="Delivered to your address"
                  checked={delivery === "home"}
                  onClick={() => setDelivery("home")}
                />
                <RadioCard
                  title="Pickup from store (free)"
                  desc="Collect in-store"
                  checked={delivery === "pickup"}
                  onClick={() => setDelivery("pickup")}
                />
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field label="Street address">
                    <input
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-monstera-lime focus:outline-none focus:border-monstera-green text-monstera-dark"
                      placeholder="Examplekatu 12 A"
                    />
                  </Field>
                </div>

                <Field label="Postal code">
                  <input
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-monstera-lime focus:outline-none focus:border-monstera-green text-monstera-dark"
                    placeholder="00100"
                    inputMode="numeric"
                  />
                  <p className="mt-1 text-xs text-monstera-brown">
                    Finland postal codes are 5 digits.
                  </p>
                </Field>

                <Field label="City">
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-monstera-lime focus:outline-none focus:border-monstera-green text-monstera-dark"
                    placeholder="Helsinki"
                  />
                </Field>
              </div>
            </Section>

            <Section title="Payment">
              <div className="grid gap-4">
                <RadioCard
                  title="Online banking"
                  desc="(Paytrail etc)"
                  checked={payment === "bank"}
                  onClick={() => setPayment("bank")}
                />
                <RadioCard
                  title="Card"
                  desc="Visa / Mastercard"
                  checked={payment === "card"}
                  onClick={() => setPayment("card")}
                />
                <RadioCard
                  title="MobilePay"
                  desc="Mobile payment"
                  checked={payment === "mobilepay"}
                  onClick={() => setPayment("mobilepay")}
                />
                <RadioCard
                  title="Invoice"
                  desc="Pay later"
                  checked={payment === "invoice"}
                  onClick={() => setPayment("invoice")}
                />
              </div>

              <div className="mt-4 bg-white rounded-xl p-4 border-2 border-monstera-green">
                <p className="text-sm text-monstera-brown">
                  In progress
                </p>
              </div>
            </Section>
          </div>

          {/* RIGHT */}
          <aside className="bg-white rounded-2xl shadow-xl p-6 border-4 border-monstera-green h-fit">
            <h2 className="text-2xl font-bold text-monstera-dark mb-4">Order summary</h2>

            <div className="space-y-3">
              {items.map((it) => (
                <div key={it.id} className="flex justify-between items-start gap-3">
                  <div>
                    <p className="font-bold text-monstera-dark">{it.name}</p>
                    <p className="text-monstera-brown text-sm">Qty: {it.qty}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-monstera-green">{eur(it.price * it.qty)}</p>
                    <button
                      type="button"
                      onClick={() => removeFromCart(it.id)}
                      title="Remove"
                      className="p-2 rounded-full hover:bg-monstera-light"
                    >
                      <svg className="w-5 h-5 text-monstera-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M10 3h4l1 4H9l1-4z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 border-t pt-4 space-y-2 text-monstera-brown">
              <Row label="Subtotal" value={eur(subtotal)} />
              <Row label="Delivery" value={eur(deliveryCost)} />
              <div className="flex justify-between font-bold text-monstera-dark text-lg pt-2">
                <span>Total</span>
                <span>{eur(total)}</span>
              </div>
              <p className="text-xs mt-1">Prices include VAT (ALV).</p>
            </div>

            <label className="mt-5 flex gap-2 text-monstera-dark">
              <input
                type="checkbox"
                checked={accept}
                onChange={(e) => setAccept(e.target.checked)}
              />
              <span className="text-sm">
                I accept terms & privacy policy.
              </span>
            </label>

            {submitMessage && (
              <div
                className={`mt-4 p-3 rounded-lg text-sm font-semibold ${
                  submitMessage.type === "success"
                    ? "bg-green-100 text-green-800 border border-green-300"
                    : "bg-red-100 text-red-800 border border-red-300"
                }`}
              >
                {submitMessage.text}
              </div>
            )}

            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={!accept || isSubmitting || items.length === 0}
              className="mt-5 w-full bg-monstera-green hover:bg-monstera-dark text-white font-bold py-3 px-6 rounded-full transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Processing..." : "Place order"}
            </button>
          </aside>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl shadow-xl p-6 border-4 border-monstera-green">
      <h2 className="text-2xl font-bold text-monstera-dark mb-4">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-bold text-monstera-dark">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function RadioCard({
  title,
  desc,
  checked,
  onClick,
}: {
  title: string;
  desc: string;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "text-left w-full rounded-xl p-4 border-2 transition duration-300",
        checked
          ? "border-monstera-green bg-monstera-light"
          : "border-monstera-lime bg-white hover:border-monstera-green",
      ].join(" ")}
    >
      <p className="font-bold text-monstera-dark">{title}</p>
      <p className="text-sm text-monstera-brown mt-1">{desc}</p>
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span className="font-bold text-monstera-dark">{value}</span>
    </div>
  );
}

function eur(n: number) {
  return new Intl.NumberFormat("fi-FI", { style: "currency", currency: "EUR" }).format(n);
}
