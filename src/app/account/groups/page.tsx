import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Groups" };
export const dynamic = "force-dynamic";

// Groups the member belongs to, and groups available to join.
export default async function GroupsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: allGroups }, { data: myMemberships }] = await Promise.all([
    supabase.from("groups").select("id, slug, name, description"),
    supabase.from("group_members").select("group_id").eq("user_id", user!.id),
  ]);

  const mine = new Set((myMemberships ?? []).map((m) => m.group_id));

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Groups</h1>
      <p className="mt-1 text-sm text-gray-500">Join a group to connect around a shared interest.</p>

      <div className="mt-6 space-y-3">
        {(allGroups ?? []).map((g) => {
          const joined = mine.has(g.id);
          return (
            <div key={g.id} className="flex items-center justify-between rounded-xl border border-black/5 p-4">
              <div>
                <h3 className="font-medium text-brand-ink">{g.name}</h3>
                <p className="text-sm text-gray-500">{g.description}</p>
              </div>
              <form action="/api/account/groups" method="post">
                <input type="hidden" name="group_id" value={g.id} />
                <input type="hidden" name="action" value={joined ? "leave" : "join"} />
                <button className={joined ? "btn-ghost text-sm" : "btn-primary text-sm"}>
                  {joined ? "Leave" : "Join"}
                </button>
              </form>
            </div>
          );
        })}
        {(!allGroups || allGroups.length === 0) && (
          <p className="text-sm text-gray-500">No groups yet. Add rows to the <code>groups</code> table.</p>
        )}
      </div>
    </div>
  );
}
