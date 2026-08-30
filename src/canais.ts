// ============================================
// API DE CANAIS - MÚLTIPLOS LINKS VIA SUPABASE
// ============================================

const SUPABASE_URL = 'https://onqxflwfkexitipylixc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_P6xFktXhhIjgC4hVxD6FxA_EbPl-clT';

let canaisCache: any[] | null = null;
let ultimaAtualizacao = 0;
const TEMPO_CACHE = 60000;

// ============================================
// BUSCAR TODOS OS LINKS DO SUPABASE
// ============================================
async function buscarLinks(): Promise<string[]> {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/canais_links?select=url&ativo=eq.true&order=ordem.asc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        if (!response.ok) return [];

        const data = await response.json();
        return data.map(item => item.url).filter(Boolean);
    } catch (error) {
        console.error('❌ Erro ao buscar links:', error);
        return [];
    }
}

// ============================================
// BAIXAR E PROCESSAR UMA LISTA M3U
// ============================================
async function baixarEProcessarLista(url: string): Promise<any[]> {
    try {
        console.log(`🔄 Baixando: ${url}`);
        const response = await fetch(url);
        if (!response.ok) return [];

        const texto = await response.text();
        const linhas = texto.split('\n');

        const canais = [];
        let canalAtual: any = null;

        for (const linha of linhas) {
            const linhaTrim = linha.trim();
            
            if (linhaTrim.startsWith('#EXTINF')) {
                const nomeMatch = linhaTrim.match(/,([^,]+)$/);
                const logoMatch = linhaTrim.match(/tvg-logo="([^"]*)"/);
                const grupoMatch = linhaTrim.match(/group-title="([^"]*)"/);
                
                canalAtual = {
                    name: nomeMatch ? nomeMatch[1] : 'Canal',
                    logo: logoMatch ? logoMatch[1] : '',
                    group: grupoMatch ? grupoMatch[1] : 'Geral',
                    stream: null
                };
            }
            
            if (linhaTrim.startsWith('http') && canalAtual) {
                canalAtual.stream = linhaTrim;
                canais.push(canalAtual);
                canalAtual = null;
            }
        }

        console.log(`✅ ${canais.length} canais de ${url}`);
        return canais;

    } catch (error) {
        console.error(`❌ Erro em ${url}:`, error.message);
        return [];
    }
}

// ============================================
// CARREGAR CANAIS DE TODOS OS LINKS
// ============================================
async function carregarCanais() {
    if (canaisCache && (Date.now() - ultimaAtualizacao) < TEMPO_CACHE) {
        return canaisCache;
    }

    const links = await buscarLinks();

    if (links.length === 0) {
        console.log('⚠️ Nenhum link encontrado, usando fallback');
        const fallback = 'https://cr7v.short.gy/TV';
        const canais = await baixarEProcessarLista(fallback);
        canaisCache = canais;
        ultimaAtualizacao = Date.now();
        return canais;
    }

    console.log(`📡 ${links.length} links encontrados`);

    let todosCanais: any[] = [];
    for (const link of links) {
        const canais = await baixarEProcessarLista(link);
        todosCanais = [...todosCanais, ...canais];
    }

    // Remover duplicatas
    const seen = new Set();
    const unicos = todosCanais.filter(canal => {
        const key = canal.name + canal.stream;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    console.log(`📊 Total: ${unicos.length} canais únicos`);
    canaisCache = unicos;
    ultimaAtualizacao = Date.now();
    return unicos;
}

// ============================================
// FUNÇÕES EXPORTADAS
// ============================================
export async function buscarCanais(query?: string, grupo?: string, limit?: number) {
    const todos = await carregarCanais();
    let resultados = todos;
    
    if (grupo) {
        resultados = resultados.filter(c => c.group === grupo);
    }
    
    if (query) {
        const termo = query.toLowerCase();
        resultados = resultados.filter(c => 
            c.name.toLowerCase().includes(termo) ||
            (c.group && c.group.toLowerCase().includes(termo))
        );
    }
    
    if (limit) {
        resultados = resultados.slice(0, limit);
    }
    
    return { total: resultados.length, canais: resultados };
}

export async function listarGrupos() {
    const todos = await carregarCanais();
    const grupos = new Set<string>();
    todos.forEach(c => { if (c.group) grupos.add(c.group); });
    return Array.from(grupos).sort();
}

export default { buscarCanais, listarGrupos };
