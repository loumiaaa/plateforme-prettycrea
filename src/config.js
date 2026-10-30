// Configuration publique de la synchronisation (Supabase).
// La clé « anon » est faite pour être publique : l'accès aux données est protégé
// par les règles de sécurité de la base (RLS) et par le chiffrement côté appareil.
// Si ces deux valeurs sont vides, la plateforme fonctionne en mode local (sans synchronisation).
window.PC_CONFIG = {
  supabaseUrl: 'https://aqkqacpmtxthlqncvote.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxa3FhY3BtdHh0aGxxbmN2b3RlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1Mjg2NzYsImV4cCI6MjEwNzEwNDY3Nn0._MOd8RyiwtrPNsfGx0yTsNchLz19Vn2SVadDQzt-SuE',
};
