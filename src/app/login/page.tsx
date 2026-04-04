"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      
      setLoading(false);
      
      if (!res.ok) {
        toast.error(data.error || "Email atau password salah.");
      } else {
        toast.success("Berhasil masuk!");
        router.push("/dashboard");
      }
    } catch (err: any) {
      setLoading(false);
      toast.error("Koneksi otentikasi gagal.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 text-white relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full bg-indigo-600 blur-[120px] opacity-20 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 rounded-full bg-fuchsia-600 blur-[120px] opacity-20 animate-pulse delay-75"></div>

      <div className="w-full max-w-md p-8 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 shadow-2xl z-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-fuchsia-400 mb-2">
            Alumni Tracker
          </h1>
          <p className="text-gray-400 text-sm">Masuk sebagai Administrator</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-black/30 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
              placeholder="admin@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-black/30 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-4 rounded-lg font-semibold bg-gradient-to-r from-indigo-500 to-fuchsia-600 hover:from-indigo-400 hover:to-fuchsia-500 transition-all shadow-[0_0_15px_rgba(99,102,241,0.5)] transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Memverifikasi..." : "Masuk"}
          </button>
        </form>
      </div>
      
      {/* Disclaimer Modal / Footer */}
      <div className="absolute bottom-6 text-xs text-gray-500 text-center w-full z-10 px-4">
        *Akses terbatas hanya untuk Administrator sistem.
      </div>
    </div>
  );
}
