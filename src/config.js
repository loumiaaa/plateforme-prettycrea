// Configuration publique de la synchronisation (Supabase).
// La clé « anon » est faite pour être publique : l'accès aux données est protégé
// par les règles de sécurité de la base (RLS) et par le chiffrement côté appareil.
// Tant que ces deux valeurs sont vides, la plateforme fonctionne en mode local (sans synchronisation).
window.PC_CONFIG = {
  supabaseUrl: '',
  supabaseAnonKey: '',
};
