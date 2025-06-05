// assets/js/api.js

const API_HOST = 'api-football-v1.p.rapidapi.com';
const API_KEY = '102ffdcac2mshf9659b20ab7d7b7p1ea8bdjsnaa051d210b0b'; // Sua chave da API

// Prefixo para as chaves do localStorage para este cache
const API_CACHE_PREFIX = 'api_football_cache_';

let requestCount = 0;
let lastRequestDate = new Date().toDateString();
const MAX_DAILY_REQUESTS = 95; // Mantenha uma margem de segurança do limite de 100

// Função para limpar caches expirados do localStorage (pode ser chamada periodicamente ou em init)
function cleanupExpiredApiCache() {
    console.log('Limpando cache da API expirado do localStorage...');
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(API_CACHE_PREFIX)) {
            try {
                const itemString = localStorage.getItem(key);
                if (itemString) {
                    const item = JSON.parse(itemString);
                    // Define uma duração padrão para checagem, ou baseada no endpoint se tivéssemos essa info aqui
                    // Por simplicidade, vamos remover se for mais antigo que 24h (cache mais longo)
                    // Ou podemos usar um timestamp de "validade" no objeto salvo.
                    // Para este exemplo, vamos considerar uma validade genérica se não tivermos a duração exata.
                    // A lógica de cacheDuration dentro de fetchFromAPI é mais específica.
                    // Esta função é mais um "garbage collector" geral.
                    const maxAge = 1000 * 60 * 60 * 24 * 2; // Ex: Remove itens com mais de 2 dias
                    if (item.timestamp < Date.now() - maxAge) {
                        console.log(`Removendo item expirado do cache da API: ${key}`);
                        localStorage.removeItem(key);
                    }
                }
            } catch (e) {
                console.error(`Erro ao processar item do cache da API ${key}:`, e);
                localStorage.removeItem(key); // Remove se corrompido
            }
        }
    }
}


export async function fetchFromAPI(endpoint, version = 'v3') {
    const today = new Date().toDateString();
    if (today !== lastRequestDate) {
        requestCount = 0;
        lastRequestDate = today;
        console.log('Contador de requisições diárias resetado.');
        cleanupExpiredApiCache(); // Limpa cache expirado uma vez por dia
    }

    const cacheKey = `${API_CACHE_PREFIX}${version}-${endpoint}`;
    
    // Define a duração do cache baseada no endpoint
    let cacheDuration = 1000 * 60 * 60; // Padrão: 1 hora
    if (endpoint.includes('odds')) {
        cacheDuration = 1000 * 60 * 5; // 5 minutos para odds
    } else if (endpoint.includes('standings') || endpoint.includes('fixtures')) {
        // (fixtures aqui NÃO inclui mais a funcionalidade de "jogos ao vivo" dedicada)
        cacheDuration = 1000 * 60 * 60 * 24; // 24 horas para classificações, dados de times/jogadores de um dia
    } else if (endpoint.includes('teams?id=') || endpoint.includes('players?id=')) {
        cacheDuration = 1000 * 60 * 60 * 24 * 7; // Cache longo para detalhes de time/jogador (7 dias)
    }


    // 1. Tentar buscar do localStorage
    try {
        const cachedItemString = localStorage.getItem(cacheKey);
        if (cachedItemString) {
            const cachedItem = JSON.parse(cachedItemString);
            if (cachedItem.timestamp > Date.now() - cacheDuration) {
                console.log(`CACHE HIT (localStorage): Dados para ${endpoint} (versão ${version}) servidos do cache.`);
                return cachedItem.data;
            } else {
                console.log(`CACHE STALE (localStorage): Dados para ${endpoint} expirados. Removendo.`);
                localStorage.removeItem(cacheKey);
            }
        }
    } catch (e) {
        console.error(`Erro ao ler cache do localStorage para ${cacheKey}:`, e);
        localStorage.removeItem(cacheKey); // Remove item corrompido
    }

    // 2. Verificar limite de requisições diárias
    if (requestCount >= MAX_DAILY_REQUESTS) {
        console.warn(`Limite de requisições diárias (${MAX_DAILY_REQUESTS}) atingido para ${today}.`);
        throw new Error('Limite de requisições diárias atingido. Tente novamente amanhã.');
    }

    // 3. Fazer a chamada à API
    try {
        console.log(`API CALL: Fazendo requisição para: https://${API_HOST}/${version}/${endpoint}`);
        const response = await fetch(`https://${API_HOST}/${version}/${endpoint}`, {
            method: 'GET',
            headers: {
                'x-rapidapi-host': API_HOST,
                'x-rapidapi-key': API_KEY,
            },
        });

        requestCount++;
        console.log(`Requisições hoje: ${requestCount}/${MAX_DAILY_REQUESTS}`);

        if (!response.ok) {
            let errorData;
            try { errorData = await response.json(); } catch (e) { errorData = { message: response.statusText }; }
            console.error('Erro na API:', errorData);
            let apiMessage = errorData.message || Object.values(errorData.errors || {}).join(', ') || response.statusText || 'Erro desconhecido na API';
            throw new Error(`Erro na API: ${apiMessage}`);
        }

        const data = await response.json();
        
        // Salvar no localStorage
        const itemToCache = {
            data: data,
            timestamp: Date.now()
        };
        try {
            localStorage.setItem(cacheKey, JSON.stringify(itemToCache));
            console.log(`CACHE SET (localStorage): Dados para ${endpoint} salvos no cache.`);
        } catch (e) {
            console.error(`Erro ao salvar no localStorage para ${cacheKey} (quota pode estar cheia):`, e);
            // Se a quota estiver cheia, podemos tentar limpar caches mais antigos
            cleanupExpiredApiCache(); // Tenta limpar e pode tentar salvar de novo, ou apenas falha desta vez
        }

        return data;
    } catch (error) {
        console.error(`Erro na requisição fetchFromAPI para ${endpoint}:`, error);
        throw error; 
    }
}

// Chamar a limpeza de cache uma vez quando o script é carregado
cleanupExpiredApiCache();