import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** Verdadeiro quando as variaveis VITE_SUPABASE_* estao configuradas. */
export const supabaseReady = Boolean(url && anonKey);

/**
 * Cliente Supabase. Quando as variaveis nao estao definidas o app mostra a tela
 * de configuracao e nunca chega a usar este cliente.
 */
export const supabase: SupabaseClient = createClient(
  url ?? 'https://placeholder.supabase.co',
  anonKey ?? 'placeholder-anon-key',
  { auth: { persistSession: false } },
);
