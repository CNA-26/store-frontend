import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

// Validation functions
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

function validatePassword(password: string): boolean {
  return password.length >= 6;
}

function validateName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 50;
}

export default function Register() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
    const navigate = useNavigate();

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 3500);
        return () => clearTimeout(timer);
    }, [toast]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setValidationErrors({});
        setToast(null);

        // Validate inputs
        const errors: { [key: string]: string } = {};
        if (!name.trim()) {
            errors.name = "Name is required";
        } else if (!validateName(name)) {
            errors.name = "Name must be 2-50 characters";
        }

        if (!email.trim()) {
            errors.email = "Email is required";
        } else if (!validateEmail(email)) {
            errors.email = "Please enter a valid email address";
        }

        if (!password) {
            errors.password = "Password is required";
        } else if (!validatePassword(password)) {
            errors.password = "Password must be at least 6 characters";
        }

        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }

        setIsSubmitting(true);

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
                            className={`w-full px-4 py-3 rounded-full border-2 focus:outline-none ${
                              validationErrors.name
                                ? "border-red-500 focus:border-red-600"
                                : "border-monstera-green focus:border-monstera-dark"
                            }`}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        {validationErrors.name && (
                            <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-monstera-dark font-semibold mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            className={`w-full px-4 py-3 rounded-full border-2 focus:outline-none ${
                              validationErrors.email
                                ? "border-red-500 focus:border-red-600"
                                : "border-monstera-green focus:border-monstera-dark"
                            }`}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        {validationErrors.email && (
                            <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-monstera-dark font-semibold mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            className={`w-full px-4 py-3 rounded-full border-2 focus:outline-none ${
                              validationErrors.password
                                ? "border-red-500 focus:border-red-600"
                                : "border-monstera-green focus:border-monstera-dark"
                            }`}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        {validationErrors.password && (
                            <p className="text-red-500 text-sm mt-1">{validationErrors.password}</p>
                        )}
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
