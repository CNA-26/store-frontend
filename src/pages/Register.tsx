import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            console.log("Register attempt:", { email, password });

            // TODO: connect to backend later

            navigate("/login");
        } catch (err) {
            console.error("Registration failed", err);
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
            <div className="bg-white border-4 border-monstera-lime rounded-2xl shadow-2xl p-10 w-full max-w-md">
                <h2 className="text-4xl font-bold text-monstera-dark mb-8 text-center">
                    Join Monstera 🌿
                </h2>

                <form onSubmit={handleRegister} className="space-y-6">
                    <div>
                        <label className="block text-monstera-dark font-semibold mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-3 rounded-full border-2 border-monstera-green focus:outline-none focus:border-monstera-dark"
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
                            className="w-full px-4 py-3 rounded-full border-2 border-monstera-green focus:outline-none focus:border-monstera-dark"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-monstera-dark hover:bg-monstera-green text-white font-bold py-3 rounded-full transition duration-300"
                    >
                        Create Account
                    </button>
                </form>

                <p className="text-center text-monstera-brown mt-6">
                    Already have an account?{" "}
                    <Link
                        to="/login"
                        className="text-monstera-green font-semibold hover:underline"
                    >
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    );
}
