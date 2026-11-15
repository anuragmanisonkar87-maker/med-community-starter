import crypto from "crypto";

// Server-side Bunny Stream helpers. The API key stays on the server.
const BASE = "https://video.bunnycdn.com";

export function bunnyConfigured() {
  return Boolean(process.env.BUNNY_STREAM_LIBRARY_ID && process.env.BUNNY_STREAM_API_KEY);
}

// Creates an empty video object in the library and returns its GUID.
export async function createBunnyVideo(title: string): Promise<string> {
  const lib = process.env.BUNNY_STREAM_LIBRARY_ID!;
  const res = await fetch(`${BASE}/library/${lib}/videos`, {
    method: "POST",
    headers: { AccessKey: process.env.BUNNY_STREAM_API_KEY!, "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error(`Bunny create failed: ${res.status}`);
  const json = await res.json();
  return json.guid as string;
}

// Builds the TUS presigned signature the browser needs to upload directly
// to Bunny: SHA256(libraryId + apiKey + expiration + videoId).
export function bunnyUploadAuth(videoId: string) {
  const lib = process.env.BUNNY_STREAM_LIBRARY_ID!;
  const key = process.env.BUNNY_STREAM_API_KEY!;
  const expiration = Math.floor(Date.now() / 1000) + 3600; // 1 hour
  const signature = crypto.createHash("sha256").update(lib + key + expiration + videoId).digest("hex");
  return { libraryId: lib, videoId, expiration, signature };
}
