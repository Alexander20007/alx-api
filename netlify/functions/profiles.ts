import { Handler } from '@netlify/functions';
import { profileService } from '../../src/services/supabase.js';

export const handler: Handler = async (event) => {
    const { userId, profileId, name, colorTheme, action } = event.queryStringParameters || {};
    if (!userId && !profileId) return { statusCode: 400, body: JSON.stringify({ error: 'userId ou profileId é obrigatório' }) };
    try {
        if (action === 'get') {
            if (!userId) return { statusCode: 400, body: JSON.stringify({ error: 'userId é obrigatório para listar perfis' }) };
            const data = await profileService.getProfiles(userId);
            return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ success: true, data }) };
        }
        if (action === 'create') {
            if (!userId || !name) return { statusCode: 400, body: JSON.stringify({ error: 'userId e name são obrigatórios' }) };
            const data = await profileService.createProfile(userId, name, colorTheme);
            return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ success: true, data }) };
        }
        if (action === 'update') {
            if (!profileId) return { statusCode: 400, body: JSON.stringify({ error: 'profileId é obrigatório' }) };
            const updates: any = {};
            if (name) updates.name = name;
            if (colorTheme) updates.color_theme = colorTheme;
            const data = await profileService.updateProfile(profileId, updates);
            return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ success: true, data }) };
        }
        if (action === 'delete') {
            if (!profileId) return { statusCode: 400, body: JSON.stringify({ error: 'profileId é obrigatório' }) };
            await profileService.deleteProfile(profileId);
            return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ success: true }) };
        }
        return { statusCode: 400, body: JSON.stringify({ error: 'Ação inválida. Use get, create, update ou delete' }) };
    } catch (error: any) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
