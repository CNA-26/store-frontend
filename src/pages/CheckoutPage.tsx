import { useEffect, useMemo, useState } from "react";
import { useCart } from "../contexts/CartContext";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const BASE_URL =
  (import.meta.env.VITE_ORDER_SERVICE_URL as string) ||
  "https://order-service-git-order-service.2.rahtiapp.fi";
const API_KEY = import.meta.env.VITE_ORDER_API_KEY;

type Delivery = "pickup" | "home";
type Payment = "invoice";


function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

function validatePhone(phone: string): boolean {
  const phoneRegex = /^[\d\s+\-().]*$/;
  const cleaned = phone.trim().replace(/\D/g, "");
  return phoneRegex.test(phone.trim()) && cleaned.length >= 7 && cleaned.length <= 15;
}

function validateName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 50;
}

function validatePostalCode(postalCode: string): boolean {
  const trimmed = postalCode.trim();
  return trimmed.length >= 2 && trimmed.length <= 10;
}

function validateAddress(address: string): boolean {
  const trimmed = address.trim();
  return trimmed.length >= 3 && trimmed.length <= 100;
}

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
  const { user } = useAuth();

  const items = cart;

  // Form state
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [street, setStreet] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [delivery, setDelivery] = useState<Delivery>("home");
  const [payment, setPayment] = useState<Payment>("invoice");
  const [accept, setAccept] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (!user) return;

    const resolvedEmail = String(
      user.email ||
      user.emailAddress ||
      user.email_address ||
      user.profile?.email ||
      ""
    );

    const resolvedName = String(
      user.name ||
      user.fullName ||
      user.displayName ||
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      ""
    ).trim();

    const [parsedFirstName = "", ...lastNameParts] = resolvedName.split(/\s+/).filter(Boolean);
    const parsedLastName = lastNameParts.join(" ");

    if (resolvedEmail) {
      setEmail((prev) => prev || resolvedEmail);
    }

    if (parsedFirstName) {
      setFirstName((prev) => prev || parsedFirstName);
    }

    if (parsedLastName) {
      setLastName((prev) => prev || parsedLastName);
    }
  }, [user]);

  const subtotal = useMemo(() => items.reduce((s, it) => s + it.price * it.qty, 0), [items]);

  const deliveryCost = useMemo(() => {
    if (delivery === "pickup") return 0;
    return 9.9; // home delivery
  }, [delivery]);

  const total = subtotal + deliveryCost;

  // Validation
  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!validateEmail(email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (!validatePhone(phone)) {
      errors.phone = "Please enter a valid phone number (7-15 digits)";
    }

    if (!firstName.trim()) {
      errors.firstName = "First name is required";
    } else if (!validateName(firstName)) {
      errors.firstName = "First name must be 2-50 characters";
    }

    if (!lastName.trim()) {
      errors.lastName = "Last name is required";
    } else if (!validateName(lastName)) {
      errors.lastName = "Last name must be 2-50 characters";
    }

    if (!street.trim()) {
      errors.street = "Street address is required";
    } else if (!validateAddress(street)) {
      errors.street = "Street address must be 3-100 characters";
    }

    if (!postalCode.trim()) {
      errors.postalCode = "Postal code is required";
    } else if (!validatePostalCode(postalCode)) {
      errors.postalCode = "Postal code must be 2-10 characters";
    }

    if (!city.trim()) {
      errors.city = "City is required";
    } else if (!validateName(city)) {
      errors.city = "City name must be 2-50 characters";
    }

    if (!accept) {
      errors.accept = "You must accept the terms and conditions";
    }

    if (items.length === 0) {
      errors.items = "Your cart is empty";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle order submission
  const handlePlaceOrder = async () => {
    if (!validateForm()) {
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
        setDelivery("home");
        setPayment("invoice");
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
                    className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none text-monstera-dark ${
                      validationErrors.email
                        ? "border-red-500 focus:border-red-600"
                        : "border-monstera-lime focus:border-monstera-green"
                    }`}
                    placeholder="name@example.com"
                  />
                  {validationErrors.email && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
                  )}
                </Field>
                <Field label="Phone number">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none text-monstera-dark ${
                      validationErrors.phone
                        ? "border-red-500 focus:border-red-600"
                        : "border-monstera-lime focus:border-monstera-green"
                    }`}
                    placeholder="+358 40 123 4567"
                  />
                  {validationErrors.phone && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.phone}</p>
                  )}
                </Field>

                <Field label="First name">
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none text-monstera-dark ${
                      validationErrors.firstName
                        ? "border-red-500 focus:border-red-600"
                        : "border-monstera-lime focus:border-monstera-green"
                    }`}
                  />
                  {validationErrors.firstName && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.firstName}</p>
                  )}
                </Field>
                <Field label="Last name">
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none text-monstera-dark ${
                      validationErrors.lastName
                        ? "border-red-500 focus:border-red-600"
                        : "border-monstera-lime focus:border-monstera-green"
                    }`}
                  />
                  {validationErrors.lastName && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.lastName}</p>
                  )}
                </Field>
              </div>
            </Section>

            <Section title="Delivery">
              <div className="grid gap-4">
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
                      className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none text-monstera-dark ${
                        validationErrors.street
                          ? "border-red-500 focus:border-red-600"
                          : "border-monstera-lime focus:border-monstera-green"
                      }`}
                      placeholder="Examplekatu 12 A"
                    />
                    {validationErrors.street && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.street}</p>
                    )}
                  </Field>
                </div>

                <Field label="Postal code">
                  <input
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none text-monstera-dark ${
                      validationErrors.postalCode
                        ? "border-red-500 focus:border-red-600"
                        : "border-monstera-lime focus:border-monstera-green"
                    }`}
                    placeholder="00100"
                    inputMode="numeric"
                  />
                  {validationErrors.postalCode && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.postalCode}</p>
                  )}
                </Field>

                <Field label="City">
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none text-monstera-dark ${
                      validationErrors.city
                        ? "border-red-500 focus:border-red-600"
                        : "border-monstera-lime focus:border-monstera-green"
                    }`}
                    placeholder="Helsinki"
                  />
                  {validationErrors.city && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.city}</p>
                  )}
                </Field>
              </div>
            </Section>

            <Section title="Payment">
              <div className="rounded-xl bg-monstera-light p-4 border-2 border-monstera-green">
                <p className="font-bold text-monstera-dark">Invoice</p>
                <p className="text-monstera-brown text-sm mt-1">
                  Payment will be processed via invoice
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

            <div className="mt-5">
              <label className="flex gap-2 text-monstera-dark">
                <input
                  type="checkbox"
                  checked={accept}
                  onChange={(e) => setAccept(e.target.checked)}
                />
                <span className="text-sm">
                  I accept terms & privacy policy.
                </span>
              </label>
              {validationErrors.accept && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.accept}</p>
              )}
            </div>

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
