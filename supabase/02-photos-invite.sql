-- La partie invitée qui a un compte (guest_id) peut lire les fichiers photos du dossier (2e dossier du chemin = id du dossier).
create policy "photos_fichiers_lecture_invite" on storage.objects for select to authenticated
  using (bucket_id = 'photos' and exists (
    select 1 from public.dossiers z
     where z.id::text = (storage.foldername(name))[2] and z.guest_id = (select auth.uid())));
