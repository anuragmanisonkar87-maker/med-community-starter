"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Module = { id: string; title: string; course_id: string; courses?: { title?: string } };

// Uploads a chosen video file to the `course-videos` storage bucket, then
// attaches its public URL to the selected lesson.
export default function UploadVideo({ modules }: { modules: Module[] }) {
  const [moduleId, setModuleId] = useState(modules[0]?.id ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!moduleId || !file) return setStatus("Pick a lesson and a video file.");
    const supabase = createClient();
    if (!supabase) return setStatus("Storage isn't configured.");

    setBusy(true);
    setStatus("Uploading…");

    // 1. Upload to Storage.
    const path = `${moduleId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
    const { error: upErr } = await supabase.storage.from("course-videos").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "video/mp4",
    });
    if (upErr) {
      setBusy(false);
      return setStatus("Upload failed: " + upErr.message);
    }

    // 2. Get its public URL.
    const { data: pub } = supabase.storage.from("course-videos").getPublicUrl(path);

    // 3. Attach the URL to the lesson (admin-checked server route).
    const res = await fetch("/api/admin/attach-video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleId, url: pub.publicUrl }),
    });

    setBusy(false);
    setStatus(res.ok ? "Done ✓ — the video now plays in that lesson." : "Saved file, but couldn't attach it to the lesson.");
  }

  return (
    <form onSubmit={upload} className="space-y-4 rounded-2xl border border-black/5 p-5">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-gray-700">Lesson</span>
        <select value={moduleId} onChange={(e) => setModuleId(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500">
          {modules.map((m) => (
            <option key={m.id} value={m.id}>
              {m.courses?.title ? `${m.courses.title} — ` : ""}{m.title}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-gray-700">Video file (mp4, webm)</span>
        <input type="file" accept="video/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="w-full text-sm" />
        <span className="mt-1 block text-xs text-gray-400">
          Supabase free tier caps uploads (≈50 MB/file). For long videos, prefer a YouTube ID or Bunny Stream.
        </span>
      </label>

      <button disabled={busy} className="btn-primary">{busy ? "Working…" : "Upload & attach"}</button>
      {status && <p className="text-sm text-gray-600">{status}</p>}
    </form>
  );
}
