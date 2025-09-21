"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/app/lib/supabaseClient";

export default function ProfilePage() {
  const supabase = getSupabaseBrowser();
  const [email, setEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [twitter, setTwitter] = useState("");
  const [github, setGithub] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id;
      setEmail(data.user?.email ?? null);
      if (!uid) return;
      const { data: prof } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, bio, location, website, twitter, github, preferences")
        .eq("id", uid)
        .single();
      setDisplayName(prof?.display_name ?? "");
      setAvatarUrl(prof?.avatar_url ?? "");
      setBio(prof?.bio ?? "");
      setLocation(prof?.location ?? "");
      setWebsite(prof?.website ?? "");
      setTwitter(prof?.twitter ?? "");
      setGithub(prof?.github ?? "");
      setEmailNotifications(Boolean(prof?.preferences?.email_notifications ?? true));
    }
    load();
  }, [supabase]);

  async function save() {
    setSaving(true);
    setMessage(null);
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) return;
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        avatar_url: avatarUrl,
        bio,
        location,
        website,
        twitter,
        github,
        preferences: { email_notifications: emailNotifications }
      })
      .eq("id", uid);
    if (error) setMessage(error.message); else setMessage("Saved.");
    setSaving(false);
  }

  if (!email) return <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center text-white">Sign in to manage profile.</div>;

  return (
    <div className="min-h-[calc(100vh-4rem)] max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white">
      <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
      <div className="card bg-white/5 backdrop-blur-xl border border-white/20">
        <div className="card-body grid grid-cols-1 gap-4">
          <div>
            <label className="text-white font-semibold mb-2 block">Display name</label>
            <input value={displayName} onChange={(e)=>setDisplayName(e.target.value)} className="input input-bordered w-full bg-white/5 text-white placeholder-gray-400" placeholder="Your name" />
          </div>
          <div>
            <label className="text-white font-semibold mb-2 block">Avatar URL</label>
            <input value={avatarUrl} onChange={(e)=>setAvatarUrl(e.target.value)} className="input input-bordered w-full bg-white/5 text-white placeholder-gray-400" placeholder="https://..." />
          </div>
          <div>
            <label className="text-white font-semibold mb-2 block">Bio</label>
            <textarea value={bio} onChange={(e)=>setBio(e.target.value)} rows={3} className="textarea textarea-bordered w-full bg-white/5 text-white placeholder-gray-400" placeholder="Tell us about yourself" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-white font-semibold mb-2 block">Location</label>
              <input value={location} onChange={(e)=>setLocation(e.target.value)} className="input input-bordered w-full bg-white/5 text-white placeholder-gray-400" placeholder="City, Country" />
            </div>
            <div>
              <label className="text-white font-semibold mb-2 block">Website</label>
              <input value={website} onChange={(e)=>setWebsite(e.target.value)} className="input input-bordered w-full bg-white/5 text-white placeholder-gray-400" placeholder="https://yoursite.com" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-white font-semibold mb-2 block">Twitter</label>
              <input value={twitter} onChange={(e)=>setTwitter(e.target.value)} className="input input-bordered w-full bg-white/5 text-white placeholder-gray-400" placeholder="@handle" />
            </div>
            <div>
              <label className="text-white font-semibold mb-2 block">GitHub</label>
              <input value={github} onChange={(e)=>setGithub(e.target.value)} className="input input-bordered w-full bg-white/5 text-white placeholder-gray-400" placeholder="username" />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <input id="email_notif" type="checkbox" className="checkbox checkbox-primary" checked={emailNotifications} onChange={(e)=>setEmailNotifications(e.target.checked)} />
            <label htmlFor="email_notif" className="text-gray-300">Email me important updates</label>
          </div>
          <div className="mt-2">
            <button className="cta-button" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save changes"}</button>
            {message && <span className="ml-3 text-sm text-gray-300">{message}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}


