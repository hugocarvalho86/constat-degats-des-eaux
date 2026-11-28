// Photo du sinistre pour la partie invitée (sans compte), tant que le lien de partage est actif.
// GET /functions/v1/photo-partagee?token=<jeton>&id=<photo_id>  → le fichier JPEG.
// Vérifie le jeton avec la clé de service (gardée sur le serveur) ; ne renvoie que les photos du dossier du lien.
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};
const fail = (status: number, message: string) =>
  new Response(JSON.stringify({ message }), { status, headers: { ...CORS, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "GET") return fail(405, "methode");
  const u = new URL(req.url);
  const token = u.searchParams.get("token") ?? "";
  const id = u.searchParams.get("id") ?? "";
  if (!/^[\w-]{16,64}$/.test(token) || !/^[0-9a-f-]{36}$/i.test(id)) return fail(404, "introuvable");

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  const { data: l } = await db.from("share_links")
    .select("dossier_id, revoked_at, used_at, expires_at").eq("token", token).maybeSingle();
  if (!l) return fail(404, "introuvable");
  if (l.revoked_at) return fail(410, "annule");
  if (l.used_at) return fail(410, "utilise");
  if (Date.parse(l.expires_at) < Date.now()) return fail(410, "expire");

  const { data: p } = await db.from("photos")
    .select("id, dossier_id, owner_id").eq("id", id).eq("dossier_id", l.dossier_id).maybeSingle();
  if (!p) return fail(404, "introuvable");

  const { data: f, error } = await db.storage.from("photos").download(`${p.owner_id}/${p.dossier_id}/${p.id}.jpg`);
  if (error || !f) return fail(404, "introuvable");
  return new Response(f, {
    headers: { ...CORS, "Content-Type": "image/jpeg", "Cache-Control": "private, no-store" },
  });
});
