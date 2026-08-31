import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config.js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Todos os serviços (profileService, historyService, favoritesService, etc.)
// permanecem os mesmos, apenas importando as configurações corretas.

export * from './services.js';
