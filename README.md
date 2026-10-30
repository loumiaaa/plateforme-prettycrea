# PrettyCrea

Plateforme privée de gestion du studio de Lucile (tatouage) : agenda, comptes (acomptes, paiements, URSSAF, part du shop) et réserves (aiguilles).
Web app installable sur iPad, iPhone et ordinateur, utilisable hors connexion, synchronisée et chiffrée de bout en bout.

## Comment c'est protégé

- Les données sont **chiffrées sur l'appareil** (AES-GCM 256) avant d'être envoyées. Supabase ne stocke que des blocs illisibles : ni rendez-vous, ni montants, ni photos en clair.
- Le **mot de passe ne quitte jamais l'appareil**. Le serveur reçoit seulement un secret de connexion qui en est dérivé, et la clé de chiffrement est dérivée séparément.
- Seuls les comptes listés dans la table `prettycrea_membres` ont accès (sécurité au niveau des lignes, RLS).
- **Mot de passe oublié** : à la création du compte, la plateforme affiche une **clé de secours** (32 caractères) à garder en lieu sûr. En cas d'oubli : écran de connexion › « Mot de passe oublié ? » › lien reçu par e-mail › clé de secours + nouveau mot de passe. Tout est retrouvé, et le nouveau mot de passe vaut sur tous les appareils. Une nouvelle clé peut être créée à tout moment dans Réglages › Sécurité.
- Sans le mot de passe **ni** la clé de secours, personne ne peut rouvrir les données : c'est le prix du chiffrement.

## Mise en route

### 1. Supabase (une seule fois)

Le script s'ajoute sans risque à un projet existant : tout est préfixé `prettycrea` et rien d'existant n'est modifié.

1. Ouvrir le projet Supabase › **SQL Editor** › **New query**.
2. Coller le contenu de [`supabase/schema.sql`](supabase/schema.sql) › **Run**. Le script peut être relancé sans risque (par exemple après une mise à jour) : il ne recrée que ce qui manque.
3. **Authentication › Sign In / Providers › Email** : vérifier que l'inscription par e-mail est autorisée (« Allow new users to sign up »). On pourra la refermer une fois le compte de Lucile créé.
4. **Authentication › URL Configuration** : ajouter l'adresse de la plateforme (étape 3) dans **Redirect URLs**, pour que les liens reçus par e-mail (confirmation du compte, mot de passe oublié) ramènent au bon endroit.
5. **Project Settings › API** : copier l'**URL du projet** et la clé **anon public**.

### 2. Brancher la plateforme sur Supabase

C'est déjà fait pour le projet actuel. Pour changer de projet, renseigner les deux valeurs dans [`src/config.js`](src/config.js) :

```js
window.PC_CONFIG = {
  supabaseUrl: 'https://xxxxxxxx.supabase.co',
  supabaseAnonKey: 'eyJhbGciOi…',
};
```

La clé « anon » est faite pour être publique : l'accès est protégé par les règles RLS et par le chiffrement.
Tant que ces valeurs sont vides, la plateforme fonctionne en mode local (sans synchronisation).

### 3. Publication (GitHub Pages)

1. Dépôt GitHub › **Settings › Pages** › **Source : GitHub Actions**.
2. Chaque modification poussée sur `main` est publiée automatiquement (onglet **Actions**).
3. Adresse : `https://loumiaaa.github.io/plateforme-prettycrea/`

### 4. Créer le compte de Lucile

1. Ouvrir la plateforme › **Espace privé** › **Première fois** › adresse e-mail + mot de passe (10 caractères minimum).
2. Confirmer l'adresse avec le lien reçu par e-mail (si la confirmation est activée sur le projet).
3. Dans Supabase › **SQL Editor**, exécuter la dernière ligne du script avec son adresse :
   ```sql
   insert into public.prettycrea_membres (user_id)
   select id from auth.users where email = 'adresse-de-lucile@exemple.fr';
   ```
4. Revenir sur la plateforme › **J'ai déjà un compte** › se connecter.
5. La **clé de secours** s'affiche : la noter ou la télécharger, la ranger ailleurs que sur l'appareil. C'est prêt.

### 5. Installer sur ses appareils

- **iPad / iPhone** : ouvrir l'adresse dans **Safari** › bouton **Partager** › **Sur l'écran d'accueil**.
- **Ordinateur** : ouvrir l'adresse dans **Chrome** ou **Edge** › icône **Installer** dans la barre d'adresse.
- Sur chaque appareil, se connecter une fois avec la même adresse et le même mot de passe : tout se synchronise.

## Notifications (téléphone, iPad, ordinateur)

Un **résumé par jour** à l'heure choisie (rendez-vous, croquis à envoyer, acomptes attendus, aiguilles à commander, repos), et en option un **rappel avant chaque rendez-vous**. Par défaut, le texte est **discret** (aucun prénom) : le serveur ne lit jamais le coffre chiffré, c'est l'appareil de Lucile qui prépare ses rappels.

Mise en place, une seule fois :

1. **Déployer la fonction d'envoi** : Supabase › **Edge Functions** › **Deploy a new function** › **Via Editor** › nom `prettycrea-notifier` › coller le contenu de [`supabase/functions/prettycrea-notifier/index.ts`](supabase/functions/prettycrea-notifier/index.ts) › **Deploy**.
2. **Secrets de la fonction** : Edge Functions › **Secrets** › ajouter `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` et `VAPID_SUBJECT` (valeurs transmises séparément : la clé privée ne doit jamais aller dans ce dépôt public).
3. **SQL** : exécuter [`supabase/notifications.sql`](supabase/notifications.sql) (tables des rappels + envoi automatique toutes les 5 minutes avec pg_cron).
4. **Sur chaque appareil** : Réglages › Notifications › **Activer sur cet appareil**, puis « Envoyer une notification de test ».
   - **iPhone / iPad** (iOS 16.4 ou plus récent) : il faut d'abord **installer** la plateforme (Safari › Partager › Sur l'écran d'accueil) et l'ouvrir depuis son icône.
   - **Ordinateur** : Chrome ou Edge (Safari sur Mac fonctionne aussi).

## Développement

```bash
python3 build.py      # construit dist/ (index.html, manifest, service worker, icônes)
```

- `src/app.js` : application (vues, logique métier, chiffrement, synchronisation)
- `src/styles.css` : design
- `src/config.js` : configuration publique Supabase
- `src/quotes.json` : citations du tableau de bord
- `public/` : manifest, service worker, icônes
- `supabase/schema.sql` : tables, règles d'accès et stockage des photos
- `supabase/notifications.sql` : rappels programmés et envoi automatique
- `supabase/functions/prettycrea-notifier/` : fonction d'envoi des notifications (Web Push)
