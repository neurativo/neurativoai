"use client";
import { useState } from "react";
import { getSupabaseBrowser } from "@/app/lib/supabaseClient";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = getSupabaseBrowser();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="card w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/20 text-white">
        <div className="card-body">
          <h1 className="card-title text-2xl">Login</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Email" className="input input-bordered w-full bg-white/5 text-white placeholder-gray-400" required />
            <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Password" className="input input-bordered w-full bg-white/5 text-white placeholder-gray-400" required />
            {error && <div className="alert alert-error bg-white/10 border border-white/20">{error}</div>}
            <button type="submit" disabled={loading} className="btn btn-primary w-full">{loading ? "Logging in..." : "Login"}</button>
          </form>
          <p className="text-sm text-gray-300 mt-4">No account? <Link href="/signup" className="text-purple-300">Sign up</Link></p>
        </div>
      </div>
    </div>
  );
}


