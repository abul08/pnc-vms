import { createClient } from "@/utils/supabase/server";
import { getUser, getProfile } from "@/utils/supabase/queries";
import { redirect } from "next/navigation";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const user = await getUser(supabase);
    
    if (!user) redirect("/login");

    const profile = await getProfile(supabase, user.id);

    if (profile?.role !== "admin") redirect("/login");

    return <>{children}</>;
}
