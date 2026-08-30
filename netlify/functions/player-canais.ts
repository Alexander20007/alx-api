import { Handler } from '@netlify/functions';
import { buscarCanais } from '../../src/canais.js';

export const handler: Handler = async (event) => {
    const { query } = event.queryStringParameters || {};

    if (!query) {
        return {
            statusCode: 400,
            headers: { 'Content-Type': 'text/html' },
            body: '<h1>Erro: query é obrigatório (ex: ?query=globo)</h1>'
        };
    }

    try {
        const resultado = await buscarCanais(query, undefined, 1);
        const canal = resultado.canais && resultado.canais.length > 0 ? resultado.canais[0] : null;

        if (!canal || !canal.stream) {
            return {
                statusCode: 404,
                headers: { 'Content-Type': 'text/html' },
                body: `<h1>❌ Nenhum canal encontrado para "${query}"</h1>`
            };
        }

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📡 ${canal.name}</title>
    <link href="https://vjs.zencdn.net/7.20.3/video-js.css" rel="stylesheet" />
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background: #0a0a0a;
            font-family: Arial, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            width: 100%;
            max-width: 1000px;
            background: #000;
            border-radius: 16px;
            overflow: hidden;
            border: 1px solid #1a1a2e;
        }
        .player-wrapper {
            position: relative;
            width: 100%;
            padding-bottom: 56.25%;
            background: #000;
        }
        .video-js {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
        }
        .info {
            padding: 15px 25px;
            background: #1a1a2e;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 10px;
            border-top: 1px solid #1a1a2e;
        }
        .info .titulo {
            color: #e50914;
            font-weight: bold;
            font-size: 18px;
        }
        .info .titulo span {
            color: #fff;
            font-weight: 400;
        }
        .info .grupo {
            color: #888;
            font-size: 13px;
        }
        .footer {
            color: #444;
            font-size: 12px;
            text-align: center;
            margin-top: 15px;
        }
        @media (max-width: 600px) {
            .info { flex-direction: column; text-align: center; }
            .info .titulo { font-size: 15px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="player-wrapper">
            <video id="player" class="video-js" controls preload="auto">
                <source src="${canal.stream}" type="application/x-mpegURL">
            </video>
        </div>
        <div class="info">
            <div class="titulo">📡 <span>${canal.name}</span></div>
            <div class="grupo">${canal.group || 'Canal'}</div>
        </div>
    </div>
    <div class="footer">
        🔗 ALX API · 📡 Canal ao vivo
    </div>
    <script src="https://vjs.zencdn.net/7.20.3/video.min.js"></script>
    <script>
        videojs('player', {
            controls: true,
            autoplay: true,
            preload: 'auto',
            html5: {
                hls: {
                    enableLowInitialPlaylist: true,
                    smoothQualityChange: true
                }
            }
        });
    </script>
</body>
</html>
        `;

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'text/html' },
            body: html
        };

    } catch (error: any) {
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'text/html' },
            body: `<h1>❌ Erro: ${error.message}</h1>`
        };
    }
};
