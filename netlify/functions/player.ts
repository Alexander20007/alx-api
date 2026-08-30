import { Handler } from '@netlify/functions';
import tmdbScrape from '../../src/index.js';

export const handler: Handler = async (event) => {
    const { tmdbId, type } = event.queryStringParameters || {};
    if (!tmdbId || !type) {
        return {
            statusCode: 400,
            headers: { 'Content-Type': 'text/html' },
            body: '<h1>Erro: tmdbId e type são obrigatórios</h1>'
        };
    }
    try {
        const result = await tmdbScrape(tmdbId, type);
        const link = result && result.length > 0 ? result[0].stream : null;
        const nome = result && result.length > 0 ? result[0].name : 'Conteúdo';
        const isM3U8 = result && result.length > 0 ? result[0].isM3U8 : false;
        if (!link) {
            return {
                statusCode: 404,
                headers: { 'Content-Type': 'text/html' },
                body: '<h1>❌ Nenhum link encontrado</h1>'
            };
        }
        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎬 ALX Player</title>
    <link href="https://vjs.zencdn.net/7.20.3/video-js.css" rel="stylesheet" />
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #0a0a0a; font-family: Arial; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
        .container { width: 100%; max-width: 1000px; background: #000; border-radius: 16px; overflow: hidden; border: 1px solid #1a1a2e; }
        .player-wrapper { position: relative; width: 100%; padding-bottom: 56.25%; background: #000; }
        .player-wrapper iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }
        .video-js { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
        .info { padding: 15px 25px; background: #1a1a2e; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; border-top: 1px solid #1a1a2e; }
        .info .titulo { color: #e50914; font-weight: bold; font-size: 18px; }
        .info .titulo span { color: #fff; font-weight: 400; }
        .info .badge { padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; background: ${isM3U8 ? '#00ff88' : '#ffaa00'}; color: #000; }
        .footer { color: #444; font-size: 12px; text-align: center; margin-top: 15px; }
        @media (max-width: 600px) { .info { flex-direction: column; text-align: center; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="player-wrapper">
            ${isM3U8 ? `
            <video id="player" class="video-js" controls preload="auto">
                <source src="${link}" type="application/x-mpegURL">
            </video>
            ` : `
            <iframe src="${link}" allowfullscreen allow="autoplay; encrypted-media; picture-in-picture"></iframe>
            `}
        </div>
        <div class="info">
            <div class="titulo">🎬 <span>${nome}</span></div>
            <div class="badge">${isM3U8 ? '🎉 Sem anúncios' : '📺 Com anúncios'}</div>
        </div>
    </div>
    <div class="footer">🔗 ALX API</div>
    ${isM3U8 ? `
    <script src="https://vjs.zencdn.net/7.20.3/video.min.js"></script>
    <script>
        videojs('player', { controls: true, autoplay: true, preload: 'auto', html5: { hls: { enableLowInitialPlaylist: true, smoothQualityChange: true } } });
    </script>
    ` : ''}
</body>
</html>`;
        return { statusCode: 200, headers: { 'Content-Type': 'text/html' }, body: html };
    } catch (error: any) {
        return { statusCode: 500, headers: { 'Content-Type': 'text/html' }, body: `<h1>❌ Erro: ${error.message}</h1>` };
    }
};
