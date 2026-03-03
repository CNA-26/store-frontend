import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useWishlist } from "../contexts/WishlistContext";

const EXTERNAL_ORDERS_URL = "https://users-frontend-users-frontend.2.rahtiapp.fi/orders";

function extractEmail(user: any): string {
  return String(
    user?.email ||
      user?.emailAddress ||
      user?.email_address ||
      user?.attributes?.email ||
      user?.profile?.email ||
      user?.contact?.email ||
      user?.contactEmail ||
      ""
  );
}

function extractUsername(user: any): string {
  const username =
    user?.username ||
    user?.userName ||
    user?.preferred_username ||
    user?.nick ||
    user?.handle ||
    "";
  return String(username);
}

function deriveNameFromEmail(email: string): string {
  if (!email) return "";
  const local = email.split("@")[0] ?? "";
  const cleaned = local.replace(/[._\-+]/g, " ").replace(/\d+/g, "").trim();
  if (!cleaned) return "";
  return cleaned
    .split(/\s+/)
    .filter(Boolean)
    .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getProfileFields(user: any) {
  const email = extractEmail(user);
  const username = extractUsername(user);
  const nameField =
    user?.name ||
    user?.fullName ||
    user?.given_name ||
    user?.firstName ||
    user?.first_name ||
    user?.displayName ||
    "";

  const usernameFromEmail = email ? email.match(/^([^@]+)/)?.[1] ?? "" : "";

  const displayName =
    String(nameField).trim() ||
    (username ? String(username).replace(/[._\-]/g, " ").replace(/(^|\s)\S/g, (char: string) => char.toUpperCase()) : "") ||
    deriveNameFromEmail(email) ||
    "—";

  const usernameDisplay =
    String(username).trim() ||
    (usernameFromEmail ? usernameFromEmail.replace(/[\s+\/=<>#%;&]/g, "") : "") ||
    "—";

  const role = String(user?.role || "USER").toUpperCase();
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return {
    email: email || "—",
    displayName,
    username: usernameDisplay,
    role,
    initials: initials || "ME",
  };
}

export default function Profile() {
  const { user, logout, login } = useAuth();
  const storedUser = localStorage.getItem("user");
  const parsedStoredUser = storedUser ? JSON.parse(storedUser) : null;
  const activeUser = user || parsedStoredUser;
  const { wishlist } = useWishlist();
  const [orders, setOrders] = useState<any[]>([]);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const navigate = useNavigate();

  const profile = getProfileFields(activeUser);

  useEffect(() => {
    const fetchProfileAndOrders = async () => {
      const token = localStorage.getItem("token") || localStorage.getItem("accessToken");

      if (!activeUser) {
        const rawUser = localStorage.getItem("user");
        if (rawUser) {
          try {
            login(JSON.parse(rawUser), token || undefined);
          } catch {}
        }
      }

      const raw = localStorage.getItem("orders");
      setOrders(raw ? JSON.parse(raw) : []);

      setProfileLoaded(true);
    };

    fetchProfileAndOrders();
  }, [activeUser, login]);

  if (!profileLoaded) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;

  if (!activeUser) {
    return (
      <div className="min-h-screen bg-monstera-light flex items-center justify-center px-4">
        <div className="bg-white border-4 border-monstera-green rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <h1 className="text-3xl font-bold text-monstera-dark mb-3">Profile</h1>
          <p className="text-monstera-brown mb-6">You are not logged in.</p>
          <div className="flex flex-col gap-3">
            <Link to="/login" className="bg-monstera-green hover:bg-monstera-dark text-white font-bold py-2 px-4 rounded-full transition duration-300">
              Go to login
            </Link>
            <Link to="/register" className="bg-monstera-lime hover:bg-monstera-brown text-monstera-dark hover:text-white font-bold py-2 px-4 rounded-full transition duration-300">
              Create account
            </Link>
            <a href={EXTERNAL_ORDERS_URL} className="text-monstera-green hover:underline text-sm">
              Go to orders
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-monstera-light py-10">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="bg-white border-4 border-monstera-green rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-monstera-dark px-6 md:px-8 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-monstera-lime text-monstera-dark font-bold text-lg flex items-center justify-center">
                {profile.initials}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-monstera-lime">{profile.displayName}</h1>
                <p className="text-monstera-light text-sm">{profile.email}</p>
              </div>
            </div>
            <span className="inline-flex items-center justify-center px-4 py-1 rounded-full bg-monstera-lime text-monstera-dark font-bold text-sm w-fit">
              {profile.role}
            </span>
          </div>

          <div className="p-6 md:p-8 grid gap-6 md:grid-cols-3">
            <section className="md:col-span-2 bg-monstera-light rounded-2xl border-2 border-monstera-green p-5">
              <h2 className="text-xl font-bold text-monstera-dark mb-4">Account details</h2>
              <div className="space-y-3 text-monstera-dark">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-monstera-green/30 pb-2">
                  <span className="font-semibold text-monstera-brown">Name</span>
                  <span className="font-bold">{profile.displayName}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-monstera-green/30 pb-2">
                  <span className="font-semibold text-monstera-brown">Username</span>
                  <span className="font-bold">{profile.username}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <span className="font-semibold text-monstera-brown">Email</span>
                  <span className="font-bold break-all">{profile.email}</span>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-2xl border-2 border-monstera-green p-5 shadow-md">
              <h2 className="text-xl font-bold text-monstera-dark mb-4">Wishlist</h2>
              <p className="text-4xl font-bold text-monstera-green leading-none">{wishlist.length}</p>
              <p className="text-monstera-brown mt-1 mb-4">saved items</p>
              <Link to="/wishlist" className="inline-flex items-center justify-center w-full bg-monstera-green hover:bg-monstera-dark text-white font-bold py-2 px-4 rounded-full transition duration-300">
                View wishlist
              </Link>
            </section>

            <section className="md:col-span-3 bg-white rounded-2xl border-2 border-monstera-green p-5 shadow-md">
              <div className="flex items-center justify-between gap-4 mb-4">
                <h2 className="text-xl font-bold text-monstera-dark">Previous orders</h2>
                <a href={EXTERNAL_ORDERS_URL} className="text-monstera-green font-semibold hover:underline text-sm">
                  Open orders page
                </a>
              </div>

              {orders.length === 0 ? (
                <p className="text-monstera-brown">No previous orders found.</p>
              ) : (
                <div className="space-y-3">
                  {orders.map((order, index) => (
                    <div key={index} className="rounded-xl bg-monstera-light border border-monstera-green/40 px-4 py-3 text-monstera-dark">
                      {order.summary || JSON.stringify(order)}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <div className="md:col-span-3 flex flex-wrap gap-3 pt-1">
              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-5 rounded-full"
              >
                Log Out
              </button>
              <Link to="/" className="bg-monstera-green hover:bg-monstera-dark text-white font-bold py-2 px-5 rounded-full">
                Back to shop
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
