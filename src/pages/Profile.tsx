import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useWishlist } from "../contexts/WishlistContext";

const EXTERNAL_LOGIN_URL = "https://users-frontend-users-frontend.2.rahtiapp.fi/login";
const EXTERNAL_ORDERS_URL = "https://users-frontend-users-frontend.2.rahtiapp.fi/orders";

export default function Profile() {
  const { user, logout, login } = useAuth();
  const storedUser = localStorage.getItem("user");
  const parsedStoredUser = storedUser ? JSON.parse(storedUser) : null;
  const activeUser = user || parsedStoredUser;
  const { wishlist } = useWishlist();
  const [orders, setOrders] = useState<any[]>([]);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const navigate = useNavigate();

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4">You are not logged in.</p>
          <Link to="/login" className="text-monstera-green font-semibold">
            Go to login
          </Link>
          <p className="mt-2 text-sm text-monstera-brown">
            <a href={EXTERNAL_LOGIN_URL} className="hover:underline">Open external login directly</a>
          </p>
          <p className="mt-2 text-sm text-monstera-brown">
            <a href={EXTERNAL_ORDERS_URL} className="hover:underline">Go to orders</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-monstera-light py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="bg-white border-4 border-monstera-green rounded-2xl p-8 shadow-lg">
          <h1 className="text-3xl font-bold mb-4">Profile</h1>

          <section className="mb-6">
            <h2 className="text-xl font-semibold">Account</h2>
            {/** Debug: log the user object so developer can inspect fields in console */}
            {typeof window !== 'undefined' && console.debug && (console.debug('profile user:', user), null)}

            {(() => {
              const u: any = activeUser;

              const extractEmail = (u: any) => {
                return (
                  u?.email || u?.emailAddress || u?.email_address || u?.attributes?.email || u?.profile?.email || u?.contact?.email || u?.contactEmail || null
                );
              };

              const extractUsername = (u: any) => {
                return u?.username || u?.userName || u?.preferred_username || u?.nick || u?.handle || null;
              };

              const deriveNameFromEmail = (email: string | null) => {
                if (!email) return null;
                const local = email.split('@')[0];
                // Replace separators with spaces, remove digits
                const cleaned = local.replace(/[._\-+]/g, ' ').replace(/\d+/g, '').trim();
                if (!cleaned) return null;
                const parts = cleaned.split(/\s+/).filter(Boolean);
                const pretty = parts.map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
                return pretty || null;
              };

              const nameField = u?.name || u?.fullName || u?.given_name || u?.firstName || u?.first_name || u?.displayName || null;
              const emailField = extractEmail(u);
              const usernameField = extractUsername(u);

              // derive a sensible display name and username using regex fallbacks
              const derivedName = deriveNameFromEmail(emailField);
              const displayName = nameField || (usernameField ? usernameField.replace(/[._\-]/g, ' ').replace(/(^|\s)\S/g, (s: string) => s.toUpperCase()) : null) || derivedName || '—';

              // username: prefer explicit username fields, otherwise extract local-part from email using regex
              const usernameFromEmail = emailField ? (emailField.match(/^([^@]+)/)?.[1] ?? null) : null;
              const usernameDisplay = usernameField || (usernameFromEmail ? usernameFromEmail.replace(/[\s+\/=<>#%;&]/g, '') : null) || '—';

              return (
                <>
                  <p className="text-monstera-dark">Name: {displayName}</p>
                  <p className="text-monstera-dark">Username: {usernameDisplay}</p>
                  <p className="text-monstera-dark">Email: {emailField || '—'}</p>
                </>
              );
            })()}
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold">Wishlist</h2>
            <p className="text-monstera-dark">Items in wishlist: {wishlist.length}</p>
            <Link to="/wishlist" className="text-monstera-green font-semibold hover:underline">
              View Wishlist
            </Link>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold">Previous Orders</h2>
            {orders.length === 0 ? (
              <p className="text-monstera-dark">No previous orders found.</p>
            ) : (
              <ul className="list-disc list-inside text-monstera-dark">
                {orders.map((o, i) => (
                  <li key={i}>{o.summary || JSON.stringify(o)}</li>
                ))}
              </ul>
            )}
          </section>

          <div className="flex gap-4">
            <button
              onClick={() => {
                logout();
                navigate("/");
              }}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full"
            >
              Log Out
            </button>
            <a
              href={EXTERNAL_ORDERS_URL}
              className="bg-monstera-dark hover:bg-monstera-green text-white font-bold py-2 px-4 rounded-full"
            >
              Orders
            </a>
            <Link to="/" className="bg-monstera-green hover:bg-monstera-dark text-white font-bold py-2 px-4 rounded-full">
              Back to shop
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
