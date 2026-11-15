import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Messages" };
export const dynamic = "force-dynamic";

// Private messages inbox. Shows the member's latest messages and a composer.
export default async function MessagesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: messages } = await supabase
    .from("private_messages")
    .select("id, sender_id, recipient_id, body, created_at")
    .or(`sender_id.eq.${user!.id},recipient_id.eq.${user!.id}`)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Messages</h1>

      <form action="/api/account/messages" method="post" className="mt-6 rounded-2xl border border-black/5 p-4">
        <input name="recipient_id" required placeholder="Recipient user ID"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500" />
        <textarea name="body" required rows={2} placeholder="Write a message…"
          className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500" />
        <button className="btn-primary mt-2 text-sm">Send</button>
      </form>

      <div className="mt-6 space-y-2">
        {(messages ?? []).map((m) => {
          const outgoing = m.sender_id === user!.id;
          return (
            <div key={m.id} className={`max-w-md rounded-xl border p-3 text-sm ${outgoing ? "ml-auto border-brand-100 bg-brand-50/60" : "border-black/5"}`}>
              <p className="text-gray-800">{m.body}</p>
              <p className="mt-1 text-xs text-gray-400">{outgoing ? "You" : "Them"} · {new Date(m.created_at).toLocaleString()}</p>
            </div>
          );
        })}
        {(!messages || messages.length === 0) && <p className="text-sm text-gray-500">No messages yet.</p>}
      </div>
    </div>
  );
}
