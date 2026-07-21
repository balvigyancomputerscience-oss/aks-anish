// ============================================================
// AKS — Supabase connection config
// This anon/public key is SAFE to expose in frontend code —
// Supabase is designed this way; real protection comes from the
// Row Level Security policies set up in schema.sql (anon = read
// only, write requires a logged-in admin).
// ============================================================
const SUPABASE_URL = "https://tdnfurbxmjnvlsbxxhvh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkbmZ1cmJ4bWpudmxzYnh4aHZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NTc0NTcsImV4cCI6MjEwMDEzMzQ1N30.gf8Y1IPMDcNsbwTClYxOeMSstfHlJmwxghzlBFgKjzk";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
