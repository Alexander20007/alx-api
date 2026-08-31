import { Handler } from '@netlify/functions';
import { ratingsService } from '../../src/services/supabase.js';

export const handler: Handler = async (event) => {
    const { profileId, mediaId, mediaType, rating, action } = event.queryStringParameters || {};
    try {
        if (action === 'get') {
            if (!profileId || !mediaId || !mediaType) return { statusCode: 400, body: JSON.stringify({ error: 'profileId, mediaId e mediaType são obrigatórios' }) };
            const data = await ratingsService.getRating(profileId, mediaId, mediaType);
            return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ success: true, rating: data }) };
        }
        if (action === 'set') {
            if (!profileId || !mediaId || !mediaType || !rating) return { statusCode: 400, body: JSON.stringify({ error: 'profileId, mediaId, mediaType e rating são obrigatórios' }) };
            const data = await ratingsService.setRating(profileId, mediaId, mediaType, rating);
            return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ success: true, data }) };
        }
        if (action === 'average') {
            if (!mediaId || !mediaType) return { statusCode: 400, body: JSON.stringify({ error: 'mediaId e mediaType são obrigatórios' }) };
            const data = await ratingsService.getAverageRating(mediaId, mediaType);
            return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ success: true, ...data }) };
        }
        return { statusCode: 400, body: JSON.stringify({ error: 'Ação inválida. Use get, set ou average' }) };
    } catch (error: any) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
