-- Appli « Constat dégâts des eaux » : base du projet Supabase « constat dégât des eaux »
-- À coller tel quel dans Supabase › SQL Editor › New query, puis « Run ».
-- Crée : dossiers, liens de partage, photos, règles d'accès (RLS), fonctions du lien, bucket privé « photos ».

create table public.dossiers (
  id uuid primary key,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  guest_id uuid references auth.users(id) on delete set null,
  constat jsonb, decl jsonb, contest jsonb,
  photos int not null default 0,
  sent_at timestamptz, part_b_at timestamptz, part_b_party text check (part_b_party in ('A','B')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.dossiers(owner_id);
create index on public.dossiers(guest_id);
alter table public.dossiers enable row level security;
create policy "dossiers_lecture" on public.dossiers for select to authenticated
  using (owner_id = (select auth.uid()) or guest_id = (select auth.uid()));
create policy "dossiers_creation" on public.dossiers for insert to authenticated
  with check (owner_id = (select auth.uid()) and guest_id is null and part_b_at is null);
create policy "dossiers_modif" on public.dossiers for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "dossiers_suppr" on public.dossiers for delete to authenticated
  using (owner_id = (select auth.uid()));
revoke update on public.dossiers from authenticated, anon;
grant update (constat, decl, contest, sent_at) on public.dossiers to authenticated;

create table public.share_links (
  token text primary key,
  dossier_id uuid not null references public.dossiers(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('voisin','syndic')),
  party text not null check (party in ('A','B')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days',
  revoked_at timestamptz, used_at timestamptz
);
create index on public.share_links(dossier_id);
create index on public.share_links(owner_id);
alter table public.share_links enable row level security;
create policy "liens_lecture" on public.share_links for select to authenticated using (owner_id = (select auth.uid()));
create policy "liens_annulation" on public.share_links for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
revoke insert, update, delete on public.share_links from authenticated, anon;
grant update (revoked_at) on public.share_links to authenticated;

create table public.photos (
  id uuid primary key,
  dossier_id uuid not null references public.dossiers(id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  caption text not null default '' check (char_length(caption) <= 200),
  size int not null default 0, w int not null default 0, h int not null default 0,
  t bigint not null default 0,
  created_at timestamptz not null default now()
);
create index on public.photos(dossier_id);
create index on public.photos(owner_id);
alter table public.photos enable row level security;
create policy "photos_lecture" on public.photos for select to authenticated using (
  owner_id = (select auth.uid()) or exists (select 1 from public.dossiers z where z.id = dossier_id and z.guest_id = (select auth.uid())));
create policy "photos_creation" on public.photos for insert to authenticated with check (
  owner_id = (select auth.uid()) and exists (select 1 from public.dossiers z where z.id = dossier_id and z.owner_id = (select auth.uid())));
create policy "photos_modif" on public.photos for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "photos_suppr" on public.photos for delete to authenticated using (owner_id = (select auth.uid()));

create or replace function public.photos_limite() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.photos where dossier_id = new.dossier_id) >= 10 then
    raise exception 'limite' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger photos_limite before insert on public.photos for each row execute function public.photos_limite();
create or replace function public.photos_compte() returns trigger language plpgsql security definer set search_path = '' as $$
declare d uuid := coalesce(new.dossier_id, old.dossier_id);
begin
  update public.dossiers set photos = (select count(*) from public.photos where dossier_id = d) where id = d;
  return null;
end $$;
create trigger photos_compte after insert or delete on public.photos for each row execute function public.photos_compte();
revoke execute on function public.photos_limite() from public, anon, authenticated;
revoke execute on function public.photos_compte() from public, anon, authenticated;

create or replace function public.touch_updated() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;
create trigger dossiers_touch before update on public.dossiers for each row execute function public.touch_updated();
revoke execute on function public.touch_updated() from public, anon, authenticated;

create or replace function public.lien_statut(l public.share_links) returns text language sql stable set search_path = '' as $$
  select case when l.revoked_at is not null then 'annule' when l.used_at is not null then 'utilise'
              when l.expires_at < now() then 'expire' else 'actif' end $$;
revoke execute on function public.lien_statut(public.share_links) from public, anon, authenticated;

create or replace function public.create_share_link(p_dossier uuid, p_role text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare z public.dossiers; tok text; l public.share_links;
begin
  select * into z from public.dossiers where id = p_dossier and owner_id = auth.uid();
  if not found then raise exception 'introuvable' using errcode = 'P0002'; end if;
  update public.share_links set revoked_at = now()
   where dossier_id = z.id and revoked_at is null and used_at is null and expires_at > now();
  tok := translate(rtrim(encode(extensions.gen_random_bytes(18), 'base64'), '='), '+/', '-_');
  insert into public.share_links(token, dossier_id, owner_id, role, party)
   values (tok, z.id, z.owner_id, case when p_role = 'syndic' then 'syndic' else 'voisin' end,
           case when z.constat->>'_route' = 'moi' then 'A' else 'B' end)
   returning * into l;
  return jsonb_build_object('token', l.token, 'role', l.role, 'party', l.party, 'createdAt', l.created_at, 'expiresAt', l.expires_at);
end $$;

create or replace function public.open_share_link(p_token text) returns jsonb
language plpgsql security definer stable set search_path = '' as $$
declare l public.share_links; z public.dossiers; c jsonb; p text; o text; st text;
begin
  select * into l from public.share_links where token = p_token;
  if not found then raise exception 'introuvable' using errcode = 'P0002'; end if;
  st := public.lien_statut(l);
  if st <> 'actif' then raise exception '%', st using errcode = 'P0003'; end if;
  select * into z from public.dossiers where id = l.dossier_id;
  c := coalesce(z.constat, '{}'::jsonb); p := l.party; o := case when p = 'B' then 'A' else 'B' end;
  return jsonb_build_object(
    'role', l.role, 'party', p, 'expiresAt', l.expires_at,
    'adresse', coalesce(c->>'adresse',''), 'date', coalesce(c->>'date',''), 'declarant', coalesce(c->>(o||'_nom'),''),
    'resume', jsonb_build_object('partie', o, 'qual', coalesce(c->>(o||'_qual'),''), 'occ', coalesce(c->>(o||'_occ'),''),
       'etage', coalesce(c->>(o||'_etage'),''), 'bat', coalesce(c->>(o||'_bat'),''),
       'assureur', coalesce(c->>(o||'_assureur'),''), 'contrat', coalesce(c->>(o||'_contrat'),'')),
    'prefill', coalesce((select jsonb_object_agg(e.k, e.v) from jsonb_each(c) e(k, v) where left(e.k, 2) = p || '_'), '{}'::jsonb),
    'photos', coalesce((select jsonb_agg(jsonb_build_object('id', ph.id, 'cap', ph.caption, 'size', ph.size, 'w', ph.w, 'h', ph.h, 't', ph.t) order by ph.t)
                        from public.photos ph where ph.dossier_id = z.id), '[]'::jsonb));
end $$;

create or replace function public.submit_part_b(p_token text, p_data jsonb, p_sig text, p_sigt text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare l public.share_links; z public.dossiers; c jsonb; p text; st text;
begin
  select * into l from public.share_links where token = p_token for update;
  if not found then raise exception 'introuvable' using errcode = 'P0002'; end if;
  st := public.lien_statut(l);
  if st <> 'actif' then raise exception '%', st using errcode = 'P0003'; end if;
  if coalesce(p_sig,'') = '' then raise exception 'signature' using errcode = 'P0004'; end if;
  if length(p_sig) > 400000 or length(coalesce(p_sigt,'')) > 400000 or pg_column_size(p_data) > 200000 then
    raise exception 'trop_gros' using errcode = 'P0005'; end if;
  select * into z from public.dossiers where id = l.dossier_id for update;
  p := l.party;
  c := coalesce((select jsonb_object_agg(e.k, e.v) from jsonb_each(coalesce(z.constat,'{}'::jsonb)) e(k, v) where left(e.k, 2) <> p || '_'), '{}'::jsonb);
  c := c || coalesce((select jsonb_object_agg(e.k, e.v) from jsonb_each(coalesce(p_data,'{}'::jsonb)) e(k, v) where left(e.k, 2) = p || '_'), '{}'::jsonb);
  c := c || jsonb_build_object('sig'||p, p_sig, 'sigt'||p, coalesce(nullif(p_sigt,''), p_sig));
  update public.dossiers set constat = c, part_b_at = now(), part_b_party = p,
    guest_id = case when auth.uid() is not null and auth.uid() <> owner_id then auth.uid() else guest_id end
   where id = z.id;
  update public.share_links set used_at = now() where token = l.token;
  return jsonb_build_object('signedAt', now(), 'constat', c - 'mailto');
end $$;

create or replace function public.delete_my_account() returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'auth' using errcode = 'P0006'; end if;
  delete from auth.users where id = auth.uid();
  return true;
end $$;

revoke execute on function public.create_share_link(uuid, text) from public, anon;
grant execute on function public.create_share_link(uuid, text) to authenticated;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
revoke execute on function public.open_share_link(text) from public;
grant execute on function public.open_share_link(text) to anon, authenticated;
revoke execute on function public.submit_part_b(text, jsonb, text, text) from public;
grant execute on function public.submit_part_b(text, jsonb, text, text) to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', false, 4000000, array['image/jpeg']);
create policy "photos_fichiers_lecture" on storage.objects for select to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "photos_fichiers_ajout" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "photos_fichiers_modif" on storage.objects for update to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "photos_fichiers_suppr" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
