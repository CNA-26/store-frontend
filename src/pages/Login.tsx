import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const USER_API_BASE =
  (import.meta.env.VITE_USER_API_BASE as string) ||
  "https://user-service-cna-26-user-service.2.rahtiapp.fi";
const ADMIN_FRONTEND_URL = "https://admin-frontend-nico-branch-cna26-admin-frontend.2.rahtiapp.fi/";

type LoginResponse = {
  accessToken?: string;
  refreshToken?: string;
  user?: {
    id?: string;
    email?: string;
    name?: string;
    role?: string;
  };
  error?: string;
  code?: string;
};

function toDisplayName(email: string) {
  const local = email.split("@")[0] ?? "User";
  return local
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`${USER_API_BASE.replace(/\/$/, "")}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data: LoginResponse = await response.json().catch(() => ({}));

      if (!response.ok || !data.accessToken) {
        throw new Error(data.error || "Login failed");
      }

      if (data.refreshToken) {
        localStorage.setItem("refreshToken", data.refreshToken);
      }

      const user = data.user ?? {
        id: email,
        email,
        name: toDisplayName(email),
        role: "USER",
      };

      login(user, data.accessToken);
      navigate("/", { replace: true });
    } catch (submitError: any) {
      setError(submitError?.message ?? "Unable to log in");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-monstera-light flex items-center justify-center px-4 relative">
      <div className="fixed left-4 top-4 z-50">
        <Link
          to="/"
          className="inline-flex items-center justify-center p-3 bg-white rounded-full shadow-lg border-2 border-monstera-green hover:bg-monstera-light transition"
          aria-label="Back to homepage"
        >
          <svg className="w-6 h-6 text-monstera-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
      </div>

      <div className="bg-white border-4 border-monstera-lime rounded-2xl shadow-2xl p-10 w-full max-w-md">
        <h2 className="text-4xl font-bold text-monstera-dark mb-8 text-center">Welcome back 🌿</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-monstera-dark font-semibold mb-2">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full px-4 py-3 rounded-full border-2 border-monstera-green focus:outline-none focus:border-monstera-dark"
            />
          </div>

          <div>
            <label className="block text-monstera-dark font-semibold mb-2">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full px-4 py-3 rounded-full border-2 border-monstera-green focus:outline-none focus:border-monstera-dark"
            />
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-monstera-dark hover:bg-monstera-green disabled:opacity-70 text-white font-bold py-3 rounded-full transition duration-300"
          >
            {isSubmitting ? "Logging in..." : "Log in"}
          </button>

          <a
            href={ADMIN_FRONTEND_URL}
            className="block w-full text-center bg-monstera-lime hover:bg-monstera-brown text-monstera-dark hover:text-white font-bold py-3 rounded-full transition duration-300"
          >
            Are you an admin?
          </a>
        </form>

        <p className="text-center text-monstera-brown mt-6">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="text-monstera-green font-semibold hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
