import { Handler } from '@netlify/functions';
import tmdbScrape from '../../src/index.js';

export const handler: Handler = async (event) => {
    const { tmdbId, type, season, episode } = event.queryStringParameters || {};

    if (!tmdbId || !type) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'tmdbId e type são obrigatórios' })
        };
    }

    try {
        const result = await tmdbScrape(tmdbId, type);
        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify(result)
        };
    } catch (error: any) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
