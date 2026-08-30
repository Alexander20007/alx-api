import { Handler } from '@netlify/functions';
import { buscarCanais, listarGrupos } from '../../src/canais.js';

export const handler: Handler = async (event) => {
    const { query, grupo, limit, action } = event.queryStringParameters || {};
    
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json'
    };
    
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers };
    }
    
    try {
        if (action === 'grupos') {
            const grupos = await listarGrupos();
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, total: grupos.length, grupos })
            };
        }
        
        const limitNum = limit ? parseInt(limit) : 100;
        const resultado = await buscarCanais(query, grupo, limitNum);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, ...resultado })
        };
        
    } catch (error: any) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ success: false, error: error.message })
        };
    }
};
