import { Handler } from '@netlify/functions';
import { commentsService } from '../../src/services/supabase.js';

export const handler: Handler = async (event) => {
    const { profileId, mediaId, mediaType, body, commentId, action } = event.queryStringParameters || {};
    try {
        if (action === 'get') {
            if (!mediaId || !mediaType) return { statusCode: 400, body: JSON.stringify({ error: 'mediaId e mediaType são obrigatórios' }) };
            const limit = parseInt(event.queryStringParameters?.limit || '20');
            const data = await commentsService.getComments(mediaId, mediaType, limit);
            return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ success: true, data }) };
        }
        if (action === 'add') {
            if (!profileId || !mediaId || !mediaType || !body) return { statusCode: 400, body: JSON.stringify({ error: 'profileId, mediaId, mediaType e body são obrigatórios' }) };
            const data = await commentsService.addComment(profileId, mediaId, mediaType, body);
            return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ success: true, data }) };
        }
        if (action === 'delete') {
            if (!commentId) return { statusCode: 400, body: JSON.stringify({ error: 'commentId é obrigatório' }) };
            await commentsService.deleteComment(commentId);
            return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ success: true }) };
        }
        return { statusCode: 400, body: JSON.stringify({ error: 'Ação inválida. Use get, add ou delete' }) };
    } catch (error: any) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
