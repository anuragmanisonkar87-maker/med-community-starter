import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: items } = await supabase
    .from("notifications")
    .select("id, kind, body, link, read_at, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const unread = (items ?? []).filter((n) => !n.read_at).length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Notifications</h1>
        {unread > 0 && (
          <form action="/api/account/notifications" method="post">
            <input type="hidden" name="action" value="mark-all-read" />
            <button className="text-sm text-brand-600 hover:underline">Mark all read</button>
          </form>
        )}
      </div>

      <div className="mt-6 space-y-2">
        {(items ?? []).map((n) => (
          <div key={n.id} className={`rounded-xl border p-4 text-sm ${n.read_at ? "border-black/5 bg-white" : "border-brand-100 bg-brand-50/50"}`}>
            <p className="text-gray-800">{n.body}</p>
            <p className="mt-1 text-xs text-gray-400">{new Date(n.created_at).toLocaleString()}</p>
          </div>
        ))}
        {(!items || items.length === 0) && <p className="text-sm text-gray-500">You're all caught up.</p>}
      </div>
    </div>
  );
}
