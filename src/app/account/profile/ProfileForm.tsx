"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  full_name?: string | null; email?: string | null; phone?: string | null;
  drn?: string | null; state?: string | null; specialty?: string | null;
  headline?: string | null; bio?: string | null;
};

// Editable profile form. Saves directly to the user's own `profiles` row
// (allowed by RLS). Phone is read-only (it's the verified login identity).
export default function ProfileForm({ profile }: { profile: Profile }) {
  const [form, setForm] = useState<Profile>(profile);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const set = (k: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    if (!supabase) return setStatus("error");
    setStatus("saving");
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name,
      email: form.email,
      drn: form.drn,
      state: form.state,
      specialty: form.specialty,
      headline: form.headline,
      bio: form.bio,
    }).eq("id", user!.id);
    setStatus(error ? "error" : "saved");
  }

  return (
    <form onSubmit={save} className="max-w-xl space-y-4">
      <Field label="Full name" value={form.full_name ?? ""} onChange={set("full_name")} />
      <Field label="Headline" value={form.headline ?? ""} onChange={set("headline")} placeholder="e.g. Cardiologist · Mumbai" />
      <Field label="Email" value={form.email ?? ""} onChange={set("email")} />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Specialty" value={form.specialty ?? ""} onChange={set("specialty")} />
        <Field label="State" value={form.state ?? ""} onChange={set("state")} />
      </div>
      <Field label="Medical registration no. (DRN)" value={form.drn ?? ""} onChange={set("drn")} />
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-gray-700">About you</span>
        <textarea value={form.bio ?? ""} onChange={set("bio")} rows={4}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-gray-700">Mobile (verified, read-only)</span>
        <input value={form.phone ?? ""} readOnly className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500" />
      </label>

      <div className="flex items-center gap-3">
        <button className="btn-primary" disabled={status === "saving"}>
          {status === "saving" ? "Saving…" : "Save changes"}
        </button>
        {status === "saved" && <span className="text-sm text-brand-600">Saved ✓</span>}
        {status === "error" && <span className="text-sm text-red-600">Couldn't save</span>}
      </div>
    </form>
  );
}

function Field({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      <input value={value} onChange={onChange} placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500" />
    </label>
  );
}
