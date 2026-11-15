"use client";

import { useState } from "react";
import * as tus from "tus-js-client";
import { createClient } from "@/lib/supabase/client";

type Module = { id: string; title: string; course_id: string; courses?: { title?: string } };
type Mode = "bunny" | "supabase";

// Upload a lesson video either to Bunny Stream (large videos, resumable) or
// to Supabase Storage (small clips). Big files go browser → Bunny directly.
export default function UploadVideo({ modules }: { modules: Module[] }) {
  const [mode, setMode] = useState<Mode>("bunny");
  const [moduleId, setModuleId] = useState(modules[0]?.id ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  async function go(e: React.FormEvent) {
    e.preventDefault();
    if (!moduleId || !file) return setStatus("Pick a lesson and a video file.");
    setBusy(true);
    setStatus("");
    setProgress(null);
    try {
      if (mode === "bunny") await uploadBunny();
      else await uploadSupabase();
    } catch (err: any) {
      setStatus("Upload failed: " + (err?.message || String(err)));
    } finally {
      setBusy(false);
    }
  }

  async function uploadBunny() {
    // 1. Create the Bunny video + get the presigned upload details.
    const res = await fetch("/api/admin/bunny-create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: file!.name }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || "create failed");
    const auth = await res.json();

    // 2. Upload the file directly to Bunny with resumable TUS.
    setStatus("Uploading to Bunny Stream…");
    await new Promise<void>((resolve, reject) => {
      const upload = new tus.Upload(file!, {
        endpoint: "https://video.bunnycdn.com/tusupload",
        retryDelays: [0, 3000, 5000, 10000, 20000],
        headers: {
          AuthorizationSignature: auth.signature,
          AuthorizationExpire: String(auth.expiration),
          VideoId: auth.videoId,
          LibraryId: auth.libraryId,
        },
        metadata: { filetype: file!.type, title: file!.name },
        onError: reject,
        onProgress: (sent, total) => setProgress(Math.round((sent / total) * 100)),
        onSuccess: () => resolve(),
      });
      upload.start();
    });

    // 3. Attach the Bunny video GUID to the lesson.
    const attach = await fetch("/api/admin/attach-bunny", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleId, bunnyVideoId: auth.videoId }),
    });
    setStatus(attach.ok ? "Done ✓ — Bunny is encoding; it'll play in the lesson shortly." : "Uploaded, but couldn't attach to the lesson.");
  }

  async function uploadSupabase() {
    const supabase = createClient();
    if (!supabase) throw new Error("Storage isn't configured.");
    setStatus("Uploading to Supabase Storage…");
    const path = `${moduleId}/${Date.now()}-${file!.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
    const { error } = await supabase.storage.from("course-videos").upload(path, file!, {
      cacheControl: "3600", upsert: false, contentType: file!.type || "video/mp4",
    });
    if (error) throw new Error(error.message);
    const { data: pub } = supabase.storage.from("course-videos").getPublicUrl(path);
    const attach = await fetch("/api/admin/attach-video", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleId, url: pub.publicUrl }),
    });
    setStatus(attach.ok ? "Done ✓ — the video now plays in that lesson." : "Saved file, but couldn't attach it.");
  }

  return (
    <form onSubmit={go} className="space-y-4 rounded-2xl border border-black/5 p-5">
      {/* Mode */}
      <div className="flex gap-2 rounded-lg bg-brand-50 p-1 text-sm">
        <button type="button" onClick={() => setMode("bunny")}
          className={`flex-1 rounded-md px-3 py-1.5 ${mode === "bunny" ? "bg-white font-medium text-brand-ink shadow-sm" : "text-gray-600"}`}>
          Bunny Stream (large videos)
        </button>
        <button type="button" onClick={() => setMode("supabase")}
          className={`flex-1 rounded-md px-3 py-1.5 ${mode === "supabase" ? "bg-white font-medium text-brand-ink shadow-sm" : "text-gray-600"}`}>
          Supabase (small clips)
        </button>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-gray-700">Lesson</span>
        <select value={moduleId} onChange={(e) => setModuleId(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500">
          {modules.map((m) => (
            <option key={m.id} value={m.id}>{m.courses?.title ? `${m.courses.title} — ` : ""}{m.title}</option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-gray-700">Video file</span>
        <input type="file" accept="video/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="w-full text-sm" />
        <span className="mt-1 block text-xs text-gray-400">
          {mode === "bunny"
            ? "Bunny Stream handles large, full-length videos with adaptive streaming."
            : "Supabase free tier caps uploads at ~50 MB per file."}
        </span>
      </label>

      {progress !== null && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div className="h-full bg-brand-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}

      <button disabled={busy} className="btn-primary">{busy ? "Working…" : "Upload & attach"}</button>
      {status && <p className="text-sm text-gray-600">{status}</p>}
    </form>
  );
}
