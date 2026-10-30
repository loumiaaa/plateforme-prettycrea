// Fonction Supabase « prettycrea-notifier » : envoie les rappels arrivés à échéance
// sur tous les appareils inscrits (Web Push). Appelée toutes les 5 minutes par pg_cron.
// Secrets à définir (Edge Functions › Secrets) : VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT.
import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT') ?? 'mailto:contact@prettycrea.fr',
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
);

Deno.serve(async () => {
  const now = new Date();
  // Un rappel en retard de plus de 6 h (serveur indisponible…) n'est plus envoyé : il serait hors de propos.
  await sb.from('prettycrea_notifications').update({ envoye_le: now.toISOString() })
    .is('envoye_le', null).lt('envoyer_le', new Date(now.getTime() - 6 * 3600e3).toISOString());

  const { data: due, error } = await sb.from('prettycrea_notifications').select('*')
    .is('envoye_le', null).lte('envoyer_le', now.toISOString()).order('envoyer_le').limit(100);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  let sent = 0;
  for (const n of due ?? []) {
    const { data: subs } = await sb.from('prettycrea_appareils').select('*').eq('user_id', n.user_id);
    const payload = JSON.stringify({ title: n.titre, body: n.corps, url: n.lien || './', tag: n.cle });
    for (const s of subs ?? []) {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 6 * 3600, urgency: 'normal' });
        sent++;
      } catch (e) {
        // Appareil désinstallé ou abonnement expiré : on l'oublie.
        if (e?.statusCode === 404 || e?.statusCode === 410) await sb.from('prettycrea_appareils').delete().eq('endpoint', s.endpoint);
      }
    }
    await sb.from('prettycrea_notifications').update({ envoye_le: now.toISOString() }).eq('user_id', n.user_id).eq('cle', n.cle);
  }
  return Response.json({ due: due?.length ?? 0, sent });
});
