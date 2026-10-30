-- =====================================================================
--  PrettyCrea · notifications (téléphone, iPad, ordinateur)
--  À exécuter APRÈS schema.sql et APRÈS avoir déployé la fonction
--  « prettycrea-notifier » (voir le README). Relançable sans risque.
--
--  Le serveur ne lit jamais les données chiffrées : c'est l'appareil de
--  Lucile qui prépare ses rappels (texte discret par défaut) et les dépose
--  ici avec leur heure d'envoi. Une tâche planifiée les envoie au bon moment.
-- =====================================================================

-- 1. Appareils qui reçoivent les notifications ------------------------------
create table if not exists public.prettycrea_appareils (
  endpoint   text primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  p256dh     text not null,
  auth       text not null,
  appareil   text,
  ajoute_le  timestamptz not null default now()
);
alter table public.prettycrea_appareils enable row level security;
drop policy if exists "prettycrea_appareils_tout" on public.prettycrea_appareils;
create policy "prettycrea_appareils_tout" on public.prettycrea_appareils for all to authenticated
  using (user_id = auth.uid() and public.prettycrea_est_membre())
  with check (user_id = auth.uid() and public.prettycrea_est_membre());
revoke all on public.prettycrea_appareils from anon;

-- 2. Rappels programmés ------------------------------------------------------
create table if not exists public.prettycrea_notifications (
  user_id    uuid not null references auth.users (id) on delete cascade,
  cle        text not null,                 -- identifiant du rappel (ex. « jour:2026-11-02 »)
  envoyer_le timestamptz not null,
  titre      text not null,
  corps      text not null,
  lien       text,
  envoye_le  timestamptz,
  primary key (user_id, cle)
);
create index if not exists prettycrea_notifications_a_envoyer
  on public.prettycrea_notifications (envoyer_le) where envoye_le is null;
alter table public.prettycrea_notifications enable row level security;
drop policy if exists "prettycrea_notifications_tout" on public.prettycrea_notifications;
create policy "prettycrea_notifications_tout" on public.prettycrea_notifications for all to authenticated
  using (user_id = auth.uid() and public.prettycrea_est_membre())
  with check (user_id = auth.uid() and public.prettycrea_est_membre());
revoke all on public.prettycrea_notifications from anon;

-- 3. Envoi automatique toutes les 5 minutes -----------------------------------
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

select cron.unschedule(jobid) from cron.job where jobname = 'prettycrea-notifier';
select cron.schedule(
  'prettycrea-notifier',
  '*/5 * * * *',
  $$
  select net.http_post(
    url     := 'https://aqkqacpmtxthlqncvote.supabase.co/functions/v1/prettycrea-notifier',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxa3FhY3BtdHh0aGxxbmN2b3RlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1Mjg2NzYsImV4cCI6MjEwNzEwNDY3Nn0._MOd8RyiwtrPNsfGx0yTsNchLz19Vn2SVadDQzt-SuE"}'::jsonb,
    body    := '{}'::jsonb
  );
  $$
);
