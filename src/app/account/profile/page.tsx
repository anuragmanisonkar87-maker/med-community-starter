import { createClient } from "@/lib/supabase/server";
import ProfileForm from "./ProfileForm";

export const metadata = { title: "Profile" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, phone, drn, state, specialty, headline, bio")
    .eq("id", user!.id)
    .single();

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Profile</h1>
      <p className="mt-1 text-sm text-gray-500">How you appear to the community.</p>
      <div className="mt-6">
        <ProfileForm profile={profile ?? {}} />
      </div>
    </div>
  );
}
