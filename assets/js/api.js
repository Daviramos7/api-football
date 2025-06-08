const API_HOST = 'api-football-v1.p.rapidapi.com';
const API_KEY = '102ffdcac2mshf9659b20ab7d7b7p1ea8bdjsnaa051d210b0b'; 
const API_CACHE_PREFIX = 'api_football_cache_';

let requestCount = 0;
let lastRequestDate = new Date().toDateString();
const MAX_DAILY_REQUESTS = 95;

function cleanupExpiredApiCache() {
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(API_CACHE_PREFIX)) {
            try {
                const itemString = localStorage.getItem(key);
                if (itemString) {
                    const item = JSON.parse(itemString);
                    const maxAge = 1000 * 60 * 60 * 24 * 2;
                    if (item.timestamp < Date.now() - maxAge) {
                        localStorage.removeItem(key);
                    }
                }
            } catch (e) { localStorage.removeItem(key); }
        }
    }
}

export async function fetchFromAPI(endpoint, version = 'v3') {
    const today = new Date().toDateString();
    if (today !== lastRequestDate) {
        requestCount = 0;
        lastRequestDate = today;
        console.log('Contador de requisições diárias resetado.');
        cleanupExpiredApiCache();
    }

    const cacheKey = `${API_CACHE_PREFIX}${version}-${endpoint}`;
    
    let cacheDuration = 1000 * 60 * 60;
    if (endpoint.includes('standings')) {
        cacheDuration = 1000 * 60 * 60 * 24;
    }

    try {
        const cachedItemString = localStorage.getItem(cacheKey);
        if (cachedItemString) {
            const cachedItem = JSON.parse(cachedItemString);
            if (cachedItem.timestamp > Date.now() - cacheDuration) {
                return cachedItem.data;
            } else {
                localStorage.removeItem(cacheKey);
            }
        }
    } catch (e) {
        localStorage.removeItem(cacheKey);
    }

    if (requestCount >= MAX_DAILY_REQUESTS) {
        throw new Error('Limite de requisições diárias atingido. Tente novamente amanhã.');
    }

    try {
        const response = await fetch(`https://${API_HOST}/${version}/${endpoint}`, {
            method: 'GET',
            headers: { 'x-rapidapi-host': API_HOST, 'x-rapidapi-key': API_KEY },
        });

        requestCount++;
        console.log(`Requisições hoje: ${requestCount}/${MAX_DAILY_REQUESTS}`);

        if (!response.ok) {
            let errorData;
            try { errorData = await response.json(); } catch (e) { errorData = { message: response.statusText }; }
            let apiMessage = errorData.message || Object.values(errorData.errors || {}).join(', ') || response.statusText || 'Erro desconhecido na API';
            throw new Error(`Erro na API: ${apiMessage}`);
        }

        const data = await response.json();
        
        const itemToCache = { data: data, timestamp: Date.now() };
        try {
            localStorage.setItem(cacheKey, JSON.stringify(itemToCache));
        } catch (e) {
            console.error(`Erro ao salvar no localStorage (quota pode estar cheia):`, e);
            cleanupExpiredApiCache(); 
        }

        return data;
    } catch (error) {
        console.error(`Erro na requisição fetchFromAPI para ${endpoint}:`, error);
        throw error; 
    }
}

cleanupExpiredApiCache();