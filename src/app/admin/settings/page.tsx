"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/app/lib/supabaseClient";

type BankSettings = {
  account_name: string;
  bank: string;
  branch: string;
  account_no: string;
  note?: string;
};

type UsdtSettings = {
  recipient: string;
  network: string;
  memo?: string;
};

type PlanConfig = {
  plus_price: number;
  premium_price: number;
  free_monthly: number;
  free_daily_cap: number;
  plus_monthly: number;
  premium_monthly: number;
  max_q_free: number;
  max_q_plus: number;
  max_q_premium: number;
};

export default function AdminSettingsPage() {
  const supabase = getSupabaseBrowser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const [bank, setBank] = useState<BankSettings>({ account_name: "", bank: "", branch: "", account_no: "" });
  const [usdt, setUsdt] = useState<UsdtSettings>({ recipient: "", network: "TRC20" });
  const [plans, setPlans] = useState<PlanConfig>({
    plus_price: 9,
    premium_price: 19,
    free_monthly: 30,
    free_daily_cap: 5,
    plus_monthly: 300,
    premium_monthly: 1000,
    max_q_free: 8,
    max_q_plus: 15,
    max_q_premium: 20,
  });
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id;
      if (!uid) { setLoading(false); return; }
      const { data: admin } = await supabase.from("admins").select("user_id").eq("user_id", uid).maybeSingle();
      setIsAdmin(Boolean(admin));

      const { data: bankRow } = await supabase.from("admin_settings").select("value").eq("key", "bank_settings").maybeSingle();
      if (bankRow?.value) setBank(bankRow.value as BankSettings);
      const { data: usdtRow } = await supabase.from("admin_settings").select("value").eq("key", "usdt_settings").maybeSingle();
      if (usdtRow?.value) setUsdt(usdtRow.value as UsdtSettings);
      const { data: plansRow } = await supabase.from("admin_settings").select("value").eq("key", "plan_config").maybeSingle();
      if (plansRow?.value) setPlans(plansRow.value as PlanConfig);

      setLoading(false);
    }
    init();
  }, [supabase]);

  async function save() {
    setMsg(null);
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid || !isAdmin) return;
    const upserts = [
      { key: "bank_settings", value: bank, updated_by: uid },
      { key: "usdt_settings", value: usdt, updated_by: uid },
      { key: "plan_config", value: plans, updated_by: uid },
    ];
    const { error } = await supabase.from("admin_settings").upsert(upserts);
    if (error) setMsg(error.message); else setMsg("Saved.");
  }

  if (loading) return <div className="text-white">Loading...</div>;
  if (!isAdmin) return <div className="text-red-300">Admins only.</div>;

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="feature-card text-left">
        <h2 className="text-xl font-semibold mb-2">Bank Transfer (Sri Lanka)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input className="input input-bordered bg-white/5 text-white" placeholder="Account Name" value={bank.account_name} onChange={(e)=>setBank({...bank, account_name: e.target.value})} />
          <input className="input input-bordered bg-white/5 text-white" placeholder="Bank" value={bank.bank} onChange={(e)=>setBank({...bank, bank: e.target.value})} />
          <input className="input input-bordered bg-white/5 text-white" placeholder="Branch" value={bank.branch} onChange={(e)=>setBank({...bank, branch: e.target.value})} />
          <input className="input input-bordered bg-white/5 text-white" placeholder="Account Number" value={bank.account_no} onChange={(e)=>setBank({...bank, account_no: e.target.value})} />
        </div>
      </div>

      <div className="feature-card text-left">
        <h2 className="text-xl font-semibold mb-2">Binance USDT</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input className="input input-bordered bg-white/5 text-white" placeholder="Recipient" value={usdt.recipient} onChange={(e)=>setUsdt({...usdt, recipient: e.target.value})} />
          <input className="input input-bordered bg-white/5 text-white" placeholder="Network" value={usdt.network} onChange={(e)=>setUsdt({...usdt, network: e.target.value})} />
          <input className="input input-bordered bg-white/5 text-white md:col-span-2" placeholder="Memo (optional)" value={usdt.memo ?? ""} onChange={(e)=>setUsdt({...usdt, memo: e.target.value})} />
        </div>
      </div>

      <div className="feature-card text-left">
        <h2 className="text-xl font-semibold mb-2">Plan Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input className="input input-bordered bg-white/5 text-white" type="number" placeholder="Plus Price ($)" value={plans.plus_price} onChange={(e)=>setPlans({...plans, plus_price: Number(e.target.value)})} />
          <input className="input input-bordered bg-white/5 text-white" type="number" placeholder="Premium Price ($)" value={plans.premium_price} onChange={(e)=>setPlans({...plans, premium_price: Number(e.target.value)})} />
          <input className="input input-bordered bg-white/5 text-white" type="number" placeholder="Free monthly" value={plans.free_monthly} onChange={(e)=>setPlans({...plans, free_monthly: Number(e.target.value)})} />
          <input className="input input-bordered bg-white/5 text-white" type="number" placeholder="Free daily cap" value={plans.free_daily_cap} onChange={(e)=>setPlans({...plans, free_daily_cap: Number(e.target.value)})} />
          <input className="input input-bordered bg-white/5 text-white" type="number" placeholder="Plus monthly" value={plans.plus_monthly} onChange={(e)=>setPlans({...plans, plus_monthly: Number(e.target.value)})} />
          <input className="input input-bordered bg-white/5 text-white" type="number" placeholder="Premium monthly" value={plans.premium_monthly} onChange={(e)=>setPlans({...plans, premium_monthly: Number(e.target.value)})} />
          <input className="input input-bordered bg-white/5 text-white" type="number" placeholder="Max Q Free" value={plans.max_q_free} onChange={(e)=>setPlans({...plans, max_q_free: Number(e.target.value)})} />
          <input className="input input-bordered bg-white/5 text-white" type="number" placeholder="Max Q Plus" value={plans.max_q_plus} onChange={(e)=>setPlans({...plans, max_q_plus: Number(e.target.value)})} />
          <input className="input input-bordered bg-white/5 text-white" type="number" placeholder="Max Q Premium" value={plans.max_q_premium} onChange={(e)=>setPlans({...plans, max_q_premium: Number(e.target.value)})} />
        </div>
      </div>

      <div>
        <button className="cta-button" onClick={save}>Save All</button>
        {msg && <span className="ml-3 text-sm text-gray-300">{msg}</span>}
      </div>
    </div>
  );
}


