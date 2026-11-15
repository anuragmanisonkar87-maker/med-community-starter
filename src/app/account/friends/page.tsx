import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Friends" };
export const dynamic = "force-dynamic";

// Friends & connections. Shows accepted connections and pending requests.
export default async function FriendsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: friendships } = await supabase
    .from("friendships")
    .select("requester_id, addressee_id, status")
    .or(`requester_id.eq.${user!.id},addressee_id.eq.${user!.id}`);

  const accepted = (friendships ?? []).filter((f) => f.status === "accepted");
  const pending = (friendships ?? []).filter((f) => f.status === "pending" && f.addressee_id === user!.id);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Friends</h1>

      <h2 className="mt-6 text-sm font-semibold text-gray-700">Requests ({pending.length})</h2>
      <div className="mt-2 space-y-2">
        {pending.map((f, i) => (
          <div key={i} className="flex items-center justify-between rounded-xl border border-black/5 p-3 text-sm">
            <span>Connection request</span>
            <span className="text-xs text-gray-400">pending</span>
          </div>
        ))}
        {pending.length === 0 && <p className="text-sm text-gray-500">No pending requests.</p>}
      </div>

      <h2 className="mt-8 text-sm font-semibold text-gray-700">Connections ({accepted.length})</h2>
      <div className="mt-2 space-y-2">
        {accepted.map((f, i) => (
          <div key={i} className="rounded-xl border border-black/5 p-3 text-sm">Connected</div>
        ))}
        {accepted.length === 0 && (
          <p className="text-sm text-gray-500">No connections yet — meet other doctors in the forums.</p>
        )}
      </div>
    </div>
  );
}
