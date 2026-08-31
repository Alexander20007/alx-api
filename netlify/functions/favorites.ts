import { Handler } from '@netlify/functions';
import { favoritesService } from '../../src/services/supabase.js';

export const handler: Handler = async (event) => {
    const { profileId, mediaId, mediaType, title, posterPath, action } = event.queryStringParameters || {};

    if (!profileId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'profileId é obrigatório' })
        };
    }

    try {
        if (action === 'get') {
            const data = await favoritesService.getFavorites(profileId);
            return {
                statusCode: 200,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ success: true, data })
            };
        }

        if (action === 'add') {
            if (!mediaId || !mediaType || !title) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'mediaId, mediaType e title são obrigatórios' })
                };
            }
            const data = await favoritesService.addFavorite(profileId, mediaId, mediaType, title, posterPath);
            return {
                statusCode: 200,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ success: true, data })
            };
        }

        if (action === 'remove') {
            if (!mediaId || !mediaType) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'mediaId e mediaType são obrigatórios' })
                };
            }
            await favoritesService.removeFavorite(profileId, mediaId, mediaType);
            return {
                statusCode: 200,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ success: true })
            };
        }

        if (action === 'check') {
            if (!mediaId || !mediaType) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'mediaId e mediaType são obrigatórios' })
                };
            }
            const isFav = await favoritesService.isFavorite(profileId, mediaId, mediaType);
            return {
                statusCode: 200,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ success: true, isFavorite: isFav })
            };
        }

        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Ação inválida. Use get, add, remove ou check' })
        };

    } catch (error: any) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
