import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function LogIn() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();
    const auth = useAuth();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch(
                "https://user-service-cna-26-user-service.2.rahtiapp.fi/api/auth/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email,
                        password,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                console.error("Backend error:", data);
                throw new Error(data.error || "Login failed");
            }

            // If the backend returns user/token in body, use it. Otherwise try to fetch /api/auth/me
            const base = "https://user-service-cna-26-user-service.2.rahtiapp.fi";
            let user = data.user || data;

            if (!user) {
                try {
                    const meRes = await fetch(`${base}/api/auth/me`, { credentials: "include" });
                    if (meRes.ok) {
                        const meData = await meRes.json();
                        user = meData.user || meData;
                    }
                } catch (err) {
                    // ignore
                }
            }

            // Persist token if present in response body
            if (data.token) {
                try { localStorage.setItem("token", data.token); } catch {}
            }

            if (user) {
                auth.login(user, data.token);
            }

            navigate("/", { replace: true });
        } catch (error) {
            console.error("Login failed:", error);
            alert("Login failed. Check console for details.");
        }
    };

    return (
        <div className="min-h-screen bg-monstera-light flex items-center justify-center px-4 relative">
            <div className="fixed left-4 top-4 z-50">
                <Link
                    to="/"
                    className="inline-flex items-center justify-center p-3 bg-white rounded-full shadow-lg border-2 border-monstera-green hover:bg-monstera-light transition"
                >
                    <svg
                        className="w-6 h-6 text-monstera-dark"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                </Link>
            </div>
            <div className="bg-white border-4 border-monstera-green rounded-2xl shadow-2xl p-10 w-full max-w-md">
                <h2 className="text-4xl font-bold text-monstera-dark mb-8 text-center">
                    Welcome Back 🌿
                </h2>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-monstera-dark font-semibold mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-3 rounded-full border-2 border-monstera-lime focus:outline-none focus:border-monstera-green"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-monstera-dark font-semibold mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-3 rounded-full border-2 border-monstera-lime focus:outline-none focus:border-monstera-green"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-monstera-green hover:bg-monstera-dark text-white font-bold py-3 rounded-full transition duration-300"
                    >
                        Log In
                    </button>
                </form>

                <p className="text-center text-monstera-brown mt-6">
                    Don’t have an account?{" "}
                    <Link
                        to="/register"
                        className="text-monstera-green font-semibold hover:underline"
                    >
                        Register here
                    </Link>
                </p>
            </div>
        </div>
    );
}
