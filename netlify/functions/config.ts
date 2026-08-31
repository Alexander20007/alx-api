import { Handler } from '@netlify/functions';
import { configService } from '../../src/services/supabase.js';

export const handler: Handler = async (event) => {
    const { key, value, descricao, action } = event.queryStringParameters || {};
    try {
        if (action === 'get') {
            if (!key) {
                const data = await configService.getAll();
                return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ success: true, data }) };
            }
            const data = await configService.get(key);
            return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ success: true, value: data }) };
        }
        if (action === 'set') {
            if (!key || value === undefined) return { statusCode: 400, body: JSON.stringify({ error: 'key e value são obrigatórios' }) };
            await configService.set(key, value, descricao);
            return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ success: true }) };
        }
        return { statusCode: 400, body: JSON.stringify({ error: 'Ação inválida. Use get ou set' }) };
    } catch (error: any) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
