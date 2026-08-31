import { Handler } from '@netlify/functions';
import { historyService } from '../../src/services/supabase.js';

export const handler: Handler = async (event) => {
    const { profileId, mediaId, mediaType, progress, total, action } = event.queryStringParameters || {};

    if (!profileId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'profileId é obrigatório' })
        };
    }

    try {
        if (action === 'get') {
            const limit = parseInt(event.queryStringParameters?.limit || '20');
            const data = await historyService.getHistory(profileId, limit);
            return {
                statusCode: 200,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ success: true, data })
            };
        }

        if (action === 'update') {
            if (!mediaId || !mediaType || progress === undefined) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'mediaId, mediaType e progress são obrigatórios' })
                };
            }
            const data = await historyService.updateProgress(profileId, mediaId, mediaType, progress, total);
            return {
                statusCode: 200,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ success: true, data })
            };
        }

        if (action === 'delete') {
            if (!mediaId || !mediaType) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'mediaId e mediaType são obrigatórios' })
                };
            }
            await historyService.deleteHistory(profileId, mediaId, mediaType);
            return {
                statusCode: 200,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ success: true })
            };
        }

        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Ação inválida. Use get, update ou delete' })
        };

    } catch (error: any) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
