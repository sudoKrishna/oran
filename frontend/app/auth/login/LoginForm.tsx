"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        });

        setLoading(false);

        if (res.ok) {
            router.push("/dashboard");
        } else {
            alert("Invalid credentials");
        }
    };

    return (
        <div className="w-full max-w-md p-8 bg-white shadow-xl rounded-2xl border border-gray-100">
            <h1 className="text-3xl font-semibold text-center mb-2">
                Welcome back
            </h1>

            <p className="text-gray-500 text-center mb-8">
                Sign in to your account
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black"
                    required
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black"
                    required
                />

                <button
                    type="submit"
                    className="w-full bg-black text-white p-3 rounded-xl hover:opacity-90 transition"
                >
                    {loading ? "Signing in..." : "Sign in"}
                </button>
            </form>

            <p className="text-center text-gray-500 mt-6">
                Don't have an account?{" "}
                <a href="/auth/signup" className="text-black font-medium">
                    Sign up
                </a>
            </p>
        </div>
    );
}