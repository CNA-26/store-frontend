import { useMemo, useState } from "react";

type Delivery = "pickup" | "posti" | "home";
type Payment = "card" | "bank" | "mobilepay" | "invoice";

export default function CheckoutPage() {
  // temp)
  const items = [
    { id: "1", name: "Monstera Deliciosa", price: 29.99, qty: 1 },
    { id: "2", name: "Succulent Mix", price: 19.99, qty: 1 },
  ];

  const [delivery, setDelivery] = useState<Delivery>("posti");
  const [payment, setPayment] = useState<Payment>("bank");
  const [accept, setAccept] = useState(true);

  const subtotal = useMemo(
    () => items.reduce((s, it) => s + it.price * it.qty, 0),
    [items]
  );

  const deliveryCost = useMemo(() => {
    if (delivery === "pickup") return 0;
    if (delivery === "posti") return 4.9; 
    return 9.9; 
  }, [delivery]);

  const total = subtotal + deliveryCost;

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
                    className="w-full px-4 py-3 rounded-xl border-2 border-monstera-lime focus:outline-none focus:border-monstera-green text-monstera-dark"
                    placeholder="name@example.com"
                  />
                </Field>
                <Field label="Phone (Finland format)">
                  <input
                    className="w-full px-4 py-3 rounded-xl border-2 border-monstera-lime focus:outline-none focus:border-monstera-green text-monstera-dark"
                    placeholder="+358 40 123 4567"
                  />
                </Field>

                <Field label="First name">
                  <input className="w-full px-4 py-3 rounded-xl border-2 border-monstera-lime focus:outline-none focus:border-monstera-green text-monstera-dark" />
                </Field>
                <Field label="Last name">
                  <input className="w-full px-4 py-3 rounded-xl border-2 border-monstera-lime focus:outline-none focus:border-monstera-green text-monstera-dark" />
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
                      className="w-full px-4 py-3 rounded-xl border-2 border-monstera-lime focus:outline-none focus:border-monstera-green text-monstera-dark"
                      placeholder="Examplekatu 12 A"
                    />
                  </Field>
                </div>

                <Field label="Postal code">
                  <input
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
                  <p className="font-bold text-monstera-green">{eur(it.price * it.qty)}</p>
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

            <button
              type="button"
              disabled={!accept}
              className="mt-5 w-full bg-monstera-green hover:bg-monstera-dark text-white font-bold py-3 px-6 rounded-full transition duration-300 disabled:opacity-50"
            >
              Place order
            </button>

            <p className="text-xs text-monstera-brown mt-3">
              In progress
            </p>
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
