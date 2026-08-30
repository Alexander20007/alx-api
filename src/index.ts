import * as cheerio from "cheerio";

const SUPABASE_URL = 'https://onqxflwfkexitipylixc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_P6xFktXhhIjgC4hVxD6FxA_EbPl-clT';

interface StreamResult {
  name: string | null;
  stream: string | null;
  referer: string;
  isM3U8: boolean;
}

let provedoresCache: any[] | null = null;
let ultimaAtualizacao = 0;
const TEMPO_CACHE = 60000;

async function buscarProvedores(): Promise<any[]> {
    if (provedoresCache && (Date.now() - ultimaAtualizacao) < TEMPO_CACHE) {
        return provedoresCache;
    }

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/provedores?select=*&ativo=eq.true&order=ordem.asc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        if (!response.ok) return [];

        const data = await response.json();
        provedoresCache = data;
        ultimaAtualizacao = Date.now();
        return data;

    } catch (error) {
        return provedoresCache || [];
    }
}

async function tmdbScrape(tmdbId: string, type: "movie" | "tv"): Promise<StreamResult[]> {
    try {
        const results: StreamResult[] = [];
        const provedores = await buscarProvedores();

        if (provedores.length === 0) return [];

        const tipoBusca = type === 'movie' ? 'Filmes' : 'Séries';
        const filtrados = provedores.filter(p => p.nome.includes(tipoBusca));

        for (const provider of filtrados) {
            try {
                const url = provider.url_template.replace(/\{id\}/g, tmdbId);
                const response = await fetch(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0',
                        'Referer': provider.referer || 'https://google.com'
                    }
                });

                if (response.ok) {
                    const html = await response.text();
                    const $ = cheerio.load(html);
                    
                    let m3u8Link = null;
                    $('video source').each((i, el) => {
                        const src = $(el).attr('src');
                        if (src && src.includes('.m3u8')) {
                            m3u8Link = src;
                        }
                    });
                    
                    if (!m3u8Link) {
                        const m3u8Match = html.match(/https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/i);
                        if (m3u8Match) m3u8Link = m3u8Match[0];
                    }
                    
                    if (m3u8Link) {
                        results.push({
                            name: provider.nome + " (M3U8)",
                            stream: m3u8Link,
                            referer: provider.referer,
                            isM3U8: true
                        });
                        continue;
                    }
                    
                    const iframeMatch = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
                    if (iframeMatch) {
                        let stream = iframeMatch[1];
                        if (stream.startsWith('//')) stream = 'https:' + stream;
                        results.push({
                            name: provider.nome + " (Iframe)",
                            stream: stream,
                            referer: provider.referer,
                            isM3U8: false
                        });
                    }
                }
            } catch (error) {
                continue;
            }
        }

        return results;

    } catch (error) {
        return [];
    }
}

export default tmdbScrape;
