"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    setLoading(false);

    if (res.ok) {
      router.push("/auth/login");
    } else {
      alert("Something went wrong");
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-white shadow-xl rounded-2xl border border-gray-100">
      <h1 className="text-3xl font-semibold text-center mb-2">
        Create account
      </h1>

      <p className="text-gray-500 text-center mb-8">
        Get started in seconds
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 rounded-xl border text-black border-gray-200 focus:outline-none focus:ring-2 focus:ring-black"
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 rounded-xl border text-black border-gray-200 focus:outline-none focus:ring-2 focus:ring-black"
          required
        />

        <button
          type="submit"
          className="w-full bg-black text-white p-3 rounded-xl hover:opacity-90 transition"
        >
          {loading ? "Creating..." : "Create Account"}
        </button>
      </form>

      <p className="text-center text-gray-500 mt-6">
        Already have an account?{" "}
        <a href="/auth/login" className="text-black font-medium">
          Login
        </a>
      </p>
    </div>
  );
}