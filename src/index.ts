import * as cheerio from "cheerio";
import { SUPABASE_URL, SUPABASE_ANON_KEY, EDGE_FUNCTION_URL, TEMPO_CACHE } from './config.js';

interface StreamResult {
  name: string | null;
  stream: string | null;
  referer: string;
  isM3U8: boolean;
}

let cache: StreamResult[] | null = null;
let ultimaAtualizacao = 0;

// ============================================
// 1. BUSCAR PROVEDORES DO SUPABASE
// ============================================
async function buscarProvedores(): Promise<any[]> {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/provedores?select=*&ativo=eq.true&order=ordem.asc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        if (!response.ok) return [];
        return await response.json();
    } catch {
        return [];
    }
}

// ============================================
// 2. USAR EDGE FUNCTION (NOVO MÉTODO)
// ============================================
async function buscarEdgeFunction(tmdbId: string, type: string): Promise<StreamResult[]> {
    try {
        const url = `${EDGE_FUNCTION_URL}?tmdbId=${tmdbId}&type=${type}`;
        console.log(`📤 Chamando Edge Function: ${url}`);
        
        const response = await fetch(url);
        if (!response.ok) {
            console.log(`⚠️ Edge Function respondeu com status ${response.status}`);
            return [];
        }
        
        const data = await response.json();
        console.log(`📥 Resposta da Edge Function: ${data.length} links`);
        return data;
    } catch (error) {
        console.error('❌ Erro na Edge Function:', error);
        return [];
    }
}

// ============================================
// 3. FUNÇÃO PRINCIPAL
// ============================================
async function tmdbScrape(tmdbId: string, type: "movie" | "tv"): Promise<StreamResult[]> {
    try {
        // VERIFICAR CACHE
        if (cache && (Date.now() - ultimaAtualizacao) < TEMPO_CACHE) {
            console.log('📦 Usando cache');
            return cache;
        }

        // 1. TENTAR EDGE FUNCTION PRIMEIRO
        let results = await buscarEdgeFunction(tmdbId, type);
        
        // 2. SE EDGE FUNCTION FALHAR, USAR PROVEDORES DO SUPABASE
        if (results.length === 0) {
            console.log('🔄 Edge Function vazia, tentando provedores...');
            results = await buscarComProvedores(tmdbId, type);
        }

        // ATUALIZAR CACHE
        cache = results;
        ultimaAtualizacao = Date.now();
        
        return results;

    } catch (error: any) {
        console.error("❌ Erro:", error.message);
        return [];
    }
}

// ============================================
// 4. FALLBACK: BUSCAR COM PROVEDORES
// ============================================
async function buscarComProvedores(tmdbId: string, type: string): Promise<StreamResult[]> {
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
        } catch {
            continue;
        }
    }

    return results;
}

export default tmdbScrape;
