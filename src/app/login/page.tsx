"use client";
import { useState } from "react";
import { signIn, signUp } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    if (isRegister) {
      if (password.length < 8) {
        setError("Password minimal harus 8 karakter");
        setLoading(false);
        return;
      }
      const { data, error } = await signUp.email({
        email,
        password,
        name,
      });
      setLoading(false);
      if (error) {
        setError(error.message || "Gagal melakukan pendaftaran akun.");
      } else {
        setSuccessMsg("Pendaftaran berhasil! Menyambungkan Anda ke dashboard...");
        setTimeout(() => {
           router.push("/dashboard");
        }, 1500);
      }
    } else {
      const { data, error } = await signIn.email({
        email,
        password,
      });
      setLoading(false);
      if (error) {
        setError(error.message || "Email atau password salah.");
      } else {
        router.push("/dashboard");
      }
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
          <p className="text-gray-400 text-sm">Masuk untuk mengelola data alumni secara aman</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm text-center">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-lg bg-green-500/20 border border-green-500/50 text-green-200 text-sm text-center">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Nama Lengkap</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-black/30 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="John Doe"
                required={isRegister}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-black/30 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              placeholder="admin@alumni.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-black/30 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-semibold bg-gradient-to-r from-indigo-500 to-fuchsia-600 hover:from-indigo-400 hover:to-fuchsia-500 transition-all shadow-[0_0_15px_rgba(99,102,241,0.5)] transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Memproses..." : (isRegister ? "Daftar Akun" : "Masuk")}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          {isRegister ? "Sudah punya akun? " : "Belum punya akun? "}
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
              setSuccessMsg("");
            }}
            className="text-indigo-400 hover:text-white transition-colors underline"
          >
            {isRegister ? "Masuk ke sini" : "Daftar di sini"}
          </button>
        </div>
      </div>
      
      {/* Disclaimer Modal / Footer */}
      <div className="absolute bottom-6 text-xs text-gray-500 text-center w-full z-10 px-4">
        *Semua data adalah untuk kepentingan pembelajaran, dilarang menyebarkan untuk kepentingan apapun.
      </div>
    </div>
  );
}
