import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dpdxceorevfudhnrmulo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_7Ccv9D3N097xwrqjuJQ7CA_kiFWbxH6';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// SERVIÇO DE PERFIS
// ============================================
export const profileService = {
  async getProfiles(userId) {
    const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  },
  async createProfile(userId, name, colorTheme = '#e50914') {
    const { data, error } = await supabase.from('profiles').insert({ user_id: userId, name, color_theme: colorTheme }).select().single();
    if (error) throw error;
    return data;
  },
  async updateProfile(profileId, updates) {
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', profileId).select().single();
    if (error) throw error;
    return data;
  },
  async deleteProfile(profileId) {
    const { error } = await supabase.from('profiles').delete().eq('id', profileId);
    if (error) throw error;
  },
};

// ============================================
// SERVIÇO DE HISTÓRICO
// ============================================
export const historyService = {
  async getHistory(profileId, limit = 20) {
    const { data, error } = await supabase.from('watch_history').select('*').eq('profile_id', profileId).order('last_watched', { ascending: false }).limit(limit);
    if (error) throw error;
    return data;
  },
  async updateProgress(profileId, mediaId, mediaType, progress, total) {
    const { data, error } = await supabase.from('watch_history').upsert({ profile_id: profileId, media_id: mediaId, media_type: mediaType, progress, total, last_watched: new Date().toISOString() }, { onConflict: 'profile_id,media_id,media_type' }).select().single();
    if (error) throw error;
    return data;
  },
  async deleteHistory(profileId, mediaId, mediaType) {
    const { error } = await supabase.from('watch_history').delete().eq('profile_id', profileId).eq('media_id', mediaId).eq('media_type', mediaType);
    if (error) throw error;
  },
};

// ============================================
// SERVIÇO DE FAVORITOS
// ============================================
export const favoritesService = {
  async getFavorites(profileId) {
    const { data, error } = await supabase.from('favorites').select('*').eq('profile_id', profileId).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  async addFavorite(profileId, mediaId, mediaType, title, posterPath) {
    const { data, error } = await supabase.from('favorites').insert({ profile_id: profileId, media_id: mediaId, media_type: mediaType, title, poster_path: posterPath }).select().single();
    if (error) throw error;
    return data;
  },
  async removeFavorite(profileId, mediaId, mediaType) {
    const { error } = await supabase.from('favorites').delete().eq('profile_id', profileId).eq('media_id', mediaId).eq('media_type', mediaType);
    if (error) throw error;
  },
  async isFavorite(profileId, mediaId, mediaType) {
    const { data, error } = await supabase.from('favorites').select('id').eq('profile_id', profileId).eq('media_id', mediaId).eq('media_type', mediaType).maybeSingle();
    if (error) throw error;
    return !!data;
  },
};

// ============================================
// SERVIÇO DE AVALIAÇÕES
// ============================================
export const ratingsService = {
  async getRating(profileId, mediaId, mediaType) {
    const { data, error } = await supabase.from('ratings').select('rating').eq('profile_id', profileId).eq('media_id', mediaId).eq('media_type', mediaType).maybeSingle();
    if (error) throw error;
    return data?.rating || null;
  },
  async setRating(profileId, mediaId, mediaType, rating) {
    const { data, error } = await supabase.from('ratings').upsert({ profile_id: profileId, media_id: mediaId, media_type: mediaType, rating }, { onConflict: 'profile_id,media_id,media_type' }).select().single();
    if (error) throw error;
    return data;
  },
  async getAverageRating(mediaId, mediaType) {
    const { data, error } = await supabase.from('ratings').select('rating').eq('media_id', mediaId).eq('media_type', mediaType);
    if (error) throw error;
    const likes = data.filter(r => r.rating === 'like').length;
    const dislikes = data.filter(r => r.rating === 'dislike').length;
    const total = likes + dislikes;
    return { likes, dislikes, total, score: total > 0 ? (likes / total) * 100 : 0 };
  },
};

// ============================================
// SERVIÇO DE COMENTÁRIOS
// ============================================
export const commentsService = {
  async getComments(mediaId, mediaType, limit = 20) {
    const { data, error } = await supabase.from('comments').select('*, profiles:profile_id (name, color_theme)').eq('media_id', mediaId).eq('media_type', mediaType).order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return data;
  },
  async addComment(profileId, mediaId, mediaType, body) {
    const { data, error } = await supabase.from('comments').insert({ profile_id: profileId, media_id: mediaId, media_type: mediaType, body }).select().single();
    if (error) throw error;
    return data;
  },
  async deleteComment(commentId) {
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (error) throw error;
  },
};

// ============================================
// SERVIÇO DE CACHE
// ============================================
export const cacheService = {
  async get(key) {
    const { data, error } = await supabase.from('cache').select('valor').eq('chave', key).gte('expira_em', new Date().toISOString()).maybeSingle();
    if (error || !data) return null;
    return data.valor;
  },
  async set(key, value, ttl = 60000) {
    const expira_em = new Date(Date.now() + ttl).toISOString();
    const { error } = await supabase.from('cache').upsert({ chave: key, valor: value, expira_em }, { onConflict: 'chave' });
    if (error) throw error;
  },
  async clear(key) {
    const { error } = await supabase.from('cache').delete().eq('chave', key);
    if (error) throw error;
  },
};

// ============================================
// SERVIÇO DE CONFIG
// ============================================
export const configService = {
  async get(key) {
    const { data, error } = await supabase.from('config').select('valor').eq('chave', key).maybeSingle();
    if (error || !data) return null;
    return data.valor;
  },
  async set(key, value, descricao = '') {
    const { error } = await supabase.from('config').upsert({ chave: key, valor: value, descricao, atualizado_em: new Date().toISOString() }, { onConflict: 'chave' });
    if (error) throw error;
  },
  async getAll() {
    const { data, error } = await supabase.from('config').select('*').order('chave');
    if (error) throw error;
    return data;
  },
};
