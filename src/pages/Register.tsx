import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 3500);
        return () => clearTimeout(timer);
    }, [toast]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setToast(null);

        try {
            const response = await fetch(
                "https://user-service-cna-26-user-service.2.rahtiapp.fi/api/auth/users",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name,
                        email,
                        password,
                    }),
                }
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                const duplicateEmail =
                    response.status === 400 ||
                    response.status === 409 ||
                    String(data?.code ?? "").toLowerCase().includes("email") ||
                    String(data?.error ?? "").toLowerCase().includes("already exists");

                if (duplicateEmail) {
                    setToast({
                        type: "error",
                        message: "That email is already registered. Try logging in instead.",
                    });
                    return;
                }

                throw new Error(data?.error || "Registration failed");
            }

            setToast({ type: "success", message: "Account created successfully 🌿" });

            navigate("/login", { replace: true });
        } catch (error: any) {
            setToast({
                type: "error",
                message: error?.message || "Registration failed. Please try again.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-monstera-light flex items-center justify-center px-4 relative">
            {toast && (
                <div className="fixed right-4 top-4 z-50">
                    <div
                        className={`rounded-xl shadow-2xl px-5 py-3 border-2 ${
                            toast.type === "error"
                                ? "bg-red-500 text-white border-red-600"
                                : "bg-monstera-green text-white border-monstera-dark"
                        }`}
                    >
                        <p className="font-semibold">{toast.message}</p>
                    </div>
                </div>
            )}
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
                            Name
                        </label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-3 rounded-full border-2 border-monstera-green focus:outline-none focus:border-monstera-dark"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

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
                        disabled={isSubmitting}
                        className="w-full bg-monstera-dark hover:bg-monstera-green disabled:opacity-70 text-white font-bold py-3 rounded-full transition duration-300"
                    >
                        {isSubmitting ? "Creating account..." : "Create Account"}
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
