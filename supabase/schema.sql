-- =====================================================================
--  PrettyCrea · coffre chiffré synchronisé
--  À exécuter une fois dans Supabase : SQL Editor › New query › Run.
--
--  Conçu pour cohabiter avec un projet existant :
--   - toutes les tables et le bucket sont préfixés « prettycrea » ;
--   - rien d'existant n'est modifié ;
--   - seuls les comptes listés dans prettycrea_membres ont accès
--     (les autres utilisateurs du projet ne voient et ne peuvent rien).
--
--  Le script peut être relancé sans risque (il ne recrée que ce qui manque).
--
--  Le serveur ne stocke que des données chiffrées sur l'appareil de Lucile
--  (AES-GCM 256, clé dérivée de son mot de passe). Il ne voit jamais
--  ni le mot de passe, ni les rendez-vous, ni les montants, ni les photos en clair.
-- =====================================================================

-- 1. Liste des comptes autorisés -------------------------------------------
create table if not exists public.prettycrea_membres (
  user_id   uuid primary key references auth.users (id) on delete cascade,
  ajoute_le timestamptz not null default now()
);

alter table public.prettycrea_membres enable row level security;

drop policy if exists "prettycrea_membres_lecture" on public.prettycrea_membres;
create policy "prettycrea_membres_lecture"
  on public.prettycrea_membres for select
  to authenticated
  using (user_id = auth.uid());

-- Fonction utilitaire : l'utilisateur connecté est-il membre ?
create or replace function public.prettycrea_est_membre()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.prettycrea_membres where user_id = auth.uid());
$$;

revoke all on function public.prettycrea_est_membre() from public, anon;
grant execute on function public.prettycrea_est_membre() to authenticated;

-- 2. Le coffre chiffré (une ligne par compte) ------------------------------
create table if not exists public.prettycrea_coffres (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  sel        text        not null,            -- sel public de dérivation de la clé
  iterations integer     not null,            -- itérations PBKDF2
  cle        text        not null,            -- clé des données, chiffrée par le mot de passe
  sel_secours text,                           -- sel public de la clé de secours
  cle_secours text,                           -- clé des données, chiffrée par la clé de secours
  iv         text        not null,            -- vecteur d'initialisation AES-GCM
  donnees    text        not null,            -- toutes les données, chiffrées (base64)
  version    bigint      not null default 1,  -- compteur pour fusionner sans écraser
  modifie_le timestamptz not null default now()
);

-- (si le script a déjà été exécuté une première fois : ajoute les colonnes de la clé de secours)
alter table public.prettycrea_coffres add column if not exists sel_secours text;
alter table public.prettycrea_coffres add column if not exists cle_secours text;

alter table public.prettycrea_coffres enable row level security;

drop policy if exists "prettycrea_coffres_lecture"     on public.prettycrea_coffres;
drop policy if exists "prettycrea_coffres_creation"    on public.prettycrea_coffres;
drop policy if exists "prettycrea_coffres_mise_a_jour" on public.prettycrea_coffres;
drop policy if exists "prettycrea_coffres_suppression" on public.prettycrea_coffres;

create policy "prettycrea_coffres_lecture"
  on public.prettycrea_coffres for select to authenticated
  using (user_id = auth.uid() and public.prettycrea_est_membre());

create policy "prettycrea_coffres_creation"
  on public.prettycrea_coffres for insert to authenticated
  with check (user_id = auth.uid() and public.prettycrea_est_membre());

create policy "prettycrea_coffres_mise_a_jour"
  on public.prettycrea_coffres for update to authenticated
  using (user_id = auth.uid() and public.prettycrea_est_membre())
  with check (user_id = auth.uid() and public.prettycrea_est_membre());

create policy "prettycrea_coffres_suppression"
  on public.prettycrea_coffres for delete to authenticated
  using (user_id = auth.uid() and public.prettycrea_est_membre());

revoke all on public.prettycrea_coffres from anon;
revoke all on public.prettycrea_membres from anon;

-- Date de modification tenue à jour par le serveur
create or replace function public.prettycrea_touch()
returns trigger
language plpgsql
as $$
begin
  new.modifie_le := now();
  return new;
end;
$$;

drop trigger if exists prettycrea_coffres_touch on public.prettycrea_coffres;
create trigger prettycrea_coffres_touch
  before update on public.prettycrea_coffres
  for each row execute function public.prettycrea_touch();

-- 3. Photos des projets (bucket privé, fichiers chiffrés) -------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('prettycrea-photos', 'prettycrea-photos', false, 5242880)
on conflict (id) do nothing;

drop policy if exists "prettycrea_photos_lecture"     on storage.objects;
drop policy if exists "prettycrea_photos_ajout"       on storage.objects;
drop policy if exists "prettycrea_photos_mise_a_jour" on storage.objects;
drop policy if exists "prettycrea_photos_suppression" on storage.objects;

create policy "prettycrea_photos_lecture"
  on storage.objects for select to authenticated
  using (bucket_id = 'prettycrea-photos'
         and (storage.foldername(name))[1] = auth.uid()::text
         and public.prettycrea_est_membre());

create policy "prettycrea_photos_ajout"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'prettycrea-photos'
              and (storage.foldername(name))[1] = auth.uid()::text
              and public.prettycrea_est_membre());

create policy "prettycrea_photos_mise_a_jour"
  on storage.objects for update to authenticated
  using (bucket_id = 'prettycrea-photos'
         and (storage.foldername(name))[1] = auth.uid()::text
         and public.prettycrea_est_membre());

create policy "prettycrea_photos_suppression"
  on storage.objects for delete to authenticated
  using (bucket_id = 'prettycrea-photos'
         and (storage.foldername(name))[1] = auth.uid()::text
         and public.prettycrea_est_membre());

-- =====================================================================
--  4. APRÈS que Lucile a créé son compte dans la plateforme :
--     remplace l'adresse ci-dessous par la sienne, puis exécute
--     uniquement ces deux lignes (sélectionne-les › Run).
-- =====================================================================
-- insert into public.prettycrea_membres (user_id)
-- select id from auth.users where email = 'adresse-de-lucile@exemple.fr'
-- on conflict (user_id) do nothing;
