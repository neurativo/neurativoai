"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/app/lib/supabaseClient";

export default function SettingsPage() {
  const supabase = getSupabaseBrowser();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, [supabase]);

  if (!email) return <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center text-white">Sign in to access settings.</div>;

  return (
    <div className="min-h-[calc(100vh-4rem)] max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <div className="card bg-white/5 backdrop-blur-xl border border-white/20">
        <div className="card-body">
          <div className="text-gray-300">More settings coming soon.</div>
        </div>
      </div>
    </div>
  );
}


