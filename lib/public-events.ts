import { createClient } from "@supabase/supabase-js";

export type PublicEvent = {
  id: string;
  title: string;
  category: string | null;
  description: string | null;
  starts_at: string | null;
  location: string | null;
  image_url: string | null;
  ticket_url: string | null;
};

function publicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  // Uses the public key and existing RLS; never use service_role for public pages.
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const fields = "id,title,category,description,starts_at,location,image_url,ticket_url";

export async function getPublishedEvent(id: string): Promise<PublicEvent | null> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null;
  const db = publicClient();
  if (!db) return null;
  const { data, error } = await db.from("events").select(fields)
    .eq("status", "published").eq("id", id).maybeSingle();
  if (error) {
    console.error("Failed to load public event", error.message);
    return null;
  }
  return data as PublicEvent | null;
}

export async function getPublishedEvents(): Promise<PublicEvent[]> {
  const db = publicClient();
  if (!db) return [];
  const { data, error } = await db.from("events").select(fields)
    .eq("status", "published").order("starts_at", { ascending: true }).limit(500);
  if (error) {
    console.error("Failed to list public events", error.message);
    return [];
  }
  return (data ?? []) as PublicEvent[];
}
