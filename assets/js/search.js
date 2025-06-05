// assets/js/search.js
import { fetchFromAPI } from './api.js';
import { 
    toggleFavorite, 
    isFavorite, 
    syncFavoriteButtons,
    FAVORITES_CHANGED_EVENT,
    FAVORITES_KEY         
} from './favorites.js'; 

const utils = {
    removeAccents: str => str.normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
    formatCountry: country => country === 'Brazil' ? 'Brasil' : country,
};

const SEARCH_RESULTS_CACHE_PREFIX = 'search_ fútbol_results_cache_'; // Adicionado _fútbol_ para diferenciar de outros caches
const SEARCH_CACHE_DURATION_MS = 1000 * 60 * 30; // Cache de 30 minutos para resultados de busca

// Função para limpar cache de busca expirado do localStorage
function cleanupExpiredSearchResultsCache() {
    console.log('Limpando cache de BUSCA expirado do localStorage...');
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(SEARCH_RESULTS_CACHE_PREFIX)) {
            try {
                const itemString = localStorage.getItem(key);
                if (itemString) {
                    const item = JSON.parse(itemString);
                    // SEARCH_CACHE_DURATION_MS é usado aqui para consistência
                    if (item.timestamp < Date.now() - SEARCH_CACHE_DURATION_MS) { 
                        console.log(`Removendo item de BUSCA expirado: ${key}`);
                        localStorage.removeItem(key);
                    }
                }
            } catch (e) {
                console.error(`Erro ao processar item do cache de BUSCA ${key}:`, e);
                localStorage.removeItem(key); 
            }
        }
    }
}


async function searchBrazilianData(query, searchType = 'all') { // searchType: 'all', 'teams', 'players'
    const normalizedQuery = utils.removeAccents(query.toLowerCase());
    const currentYear = new Date().getFullYear();
    const cacheKey = `${SEARCH_RESULTS_CACHE_PREFIX}${normalizedQuery}_type-${searchType}`;

    console.log(`DEBUG: search.js (searchBrazilianData) - Iniciando busca para: "${query}", Tipo: "${searchType}"`);

    // 1. Tentar buscar do localStorage para resultados de busca completos
    try {
        const cachedItemString = localStorage.getItem(cacheKey);
        if (cachedItemString) {
            const cachedItem = JSON.parse(cachedItemString);
            if (cachedItem.timestamp > Date.now() - SEARCH_CACHE_DURATION_MS) {
                console.log(`CACHE HIT (localStorage): Resultados de BUSCA para "${query}" (Tipo: ${searchType}) servidos do cache.`);
                return cachedItem.data;
            } else {
                console.log(`CACHE STALE (localStorage): Resultados de BUSCA para "${query}" (Tipo: ${searchType}) expirados. Removendo.`);
                localStorage.removeItem(cacheKey);
            }
        }
    } catch (e) {
        console.error(`Erro ao ler cache de BUSCA do localStorage para ${cacheKey}:`, e);
        localStorage.removeItem(cacheKey);
    }

    const results = {
        teams: new Map(),     // Usar Map para evitar duplicatas se a mesma entidade vier de fontes diferentes (menos provável agora)
        players: new Map()
    };
    const searchingMessageDiv = document.getElementById('searchResults');

    try {
        // BUSCAR TIMES (se searchType for 'all' ou 'teams')
        if (searchType === 'all' || searchType === 'teams') {
            if (searchingMessageDiv) searchingMessageDiv.innerHTML = `<div class="searching-message">Buscando times...</div>`;
            const teamSearchTerm = encodeURIComponent(query);
            console.log(`DEBUG: search.js - Chamando API para TIMES: teams?country=Brazil&search=${teamSearchTerm}`);
            const teamRes = await fetchFromAPI(`teams?country=Brazil&search=${teamSearchTerm}`);
            
            if (teamRes?.response?.length > 0) {
                teamRes.response.forEach(({ team, venue }) => {
                    if (team.country === 'Brazil' && utils.removeAccents(team.name.toLowerCase()).includes(normalizedQuery)) {
                        const teamId = Number(team.id);
                        if (isNaN(teamId)) return; 
                        results.teams.set(teamId, {
                            id: teamId, name: team.name, logo: team.logo,
                            country: utils.formatCountry(team.country), city: team.city || 'Não informada',
                            founded: team.founded, venue: venue, leagues: ["Nacional"] 
                        });
                    }
                });
            }
            console.log(`DEBUG: search.js - Times encontrados e filtrados: ${results.teams.size}`);
        }

        // BUSCAR JOGADORES (se searchType for 'all' ou 'players')
        if (searchType === 'all' || searchType === 'players') {
            if (searchingMessageDiv) searchingMessageDiv.innerHTML = `<div class="searching-message">Buscando jogadores...</div>`;
            const playerSearchTerm = encodeURIComponent(query);
            console.log(`DEBUG: search.js - Chamando API para JOGADORES: players?search=${playerSearchTerm}&season=${currentYear}`);
            const playerRes = await fetchFromAPI(`players?search=${playerSearchTerm}&season=${currentYear}`);

            if (playerRes?.response?.length > 0) {
                playerRes.response.forEach(({ player, statistics }) => {
                    const isBrazilianNational = player.nationality === 'Brazil';
                    const latestStat = statistics?.[0];
                    const playsInBrazil = latestStat?.team?.country === 'Brazil' || latestStat?.league?.country === 'Brazil';

                    if ((isBrazilianNational || playsInBrazil) && utils.removeAccents(player.name.toLowerCase()).includes(normalizedQuery)) {
                        const playerId = Number(player.id);
                         if (isNaN(playerId)) return;
                        const teamInfo = latestStat?.team || { name: 'Clube não informado', logo: null };
                        const leagueInfo = latestStat?.league || { name: 'Liga não informada' };
                        results.players.set(playerId, {
                            id: playerId, name: player.name, photo: player.photo, age: player.age,
                            nationality: utils.formatCountry(player.nationality),
                            team: { id: Number(teamInfo.id), name: teamInfo.name, logo: teamInfo.logo },
                            leagues: [leagueInfo.name] 
                        });
                    }
                });
            }
            console.log(`DEBUG: search.js - Jogadores encontrados e filtrados: ${results.players.size}`);
        }

    } catch (error) {
        console.error(`DEBUG: search.js (searchBrazilianData) - Erro durante a busca global por "${query}":`, error);
        if (searchingMessageDiv && error.message.includes('Limite de requisições diárias atingido')) {
            throw error; 
        }
    }

    // Mesmo que um tipo não tenha sido buscado, as arrays estarão vazias, o que é ok.
    const finalResults = {
        teams: Array.from(results.teams.values()).sort((a, b) => a.name.localeCompare(b.name)),
        players: Array.from(results.players.values()).sort((a, b) => a.name.localeCompare(b.name))
    };
    
    // Salvar no localStorage
    const itemToCache = {
        data: finalResults,
        timestamp: Date.now()
    };
    try {
        localStorage.setItem(cacheKey, JSON.stringify(itemToCache));
        console.log(`CACHE SET (localStorage): Resultados de BUSCA para "${query}" (Tipo: ${searchType}) salvos.`);
    } catch (e) {
        console.error(`Erro ao salvar resultados de BUSCA no localStorage para ${cacheKey}:`, e);
        cleanupExpiredSearchResultsCache(); // Tenta limpar caches antigos se a quota estiver cheia
    }
    
    console.log(`DEBUG: search.js (searchBrazilianData) - Busca por "${query}" (Tipo: ${searchType}) concluída.`);
    return finalResults;
}

// --- Funções de Renderização (SEM links para detalhes) ---
// (renderTeamCard e renderPlayerCard permanecem como na mensagem #99)
function renderTeamCard(team) {
    const isFav = isFavorite('teams', { id: team.id });
    const teamDataString = JSON.stringify({
        id: team.id, name: team.name, logo: team.logo || 'assets/img/team-placeholder.png',
        leagues: team.leagues, country: team.country, city: team.city,
        founded: team.founded, venue: team.venue 
    }).replace(/"/g, '&quot;');

    return `
        <div class="card team-card" data-id="${team.id}" data-type="teams">
            <div class="favorite-button-container">
                <button class="favorite-btn ${isFav ? 'favored' : ''}"
                    onclick="window.handleToggleFavorite('teams', ${teamDataString})"
                    data-type="teams" data-id="${team.id}" aria-label="Favoritar ${team.name}">★</button>
            </div>
            <div class="team-header">
                <img src="${team.logo || 'assets/img/team-placeholder.png'}" alt="Logo do ${team.name}" class="team-logo" onerror="this.onerror=null; this.src='assets/img/team-placeholder.png'">
            </div>
            <div class="team-info">
                <h3>${team.name}</h3>
            </div>
        </div>`;
}

function renderPlayerCard(player) {
    const isFav = isFavorite('players', { id: player.id });
    const playerDataString = JSON.stringify({
        id: player.id, name: player.name, photo: player.photo || 'assets/img/player-placeholder.png',
        age: player.age, nationality: player.nationality,
        leagues: player.leagues, team: player.team 
    }).replace(/"/g, '&quot;');

    return `
        <div class="card player-card" data-id="${player.id}" data-type="players">
            <div class="favorite-button-container">
                <button class="favorite-btn ${isFav ? 'favored' : ''}"
                    onclick="window.handleToggleFavorite('players', ${playerDataString})"
                    data-type="players" data-id="${player.id}" aria-label="Favoritar ${player.name}">★</button>
            </div>
            <div class="player-photo-container">
                <img src="${player.photo || 'assets/img/player-placeholder.png'}" alt="Foto de ${player.name}" class="player-photo" onerror="this.onerror=null; this.src='assets/img/player-placeholder.png'">
                ${player.team?.logo ? 
                    `<img src="${player.team.logo}" alt="${player.team.name || ''}" class="team-logo-overlay" onerror="this.onerror=null; this.src='assets/img/team-placeholder.png'">` 
                    : ''}
            </div>
            <div class="player-info">
                <h3>${player.name}</h3>
            </div>
        </div>`;
}


async function renderSearchResults(query, searchType = 'all') { // Recebe searchType
    const resultsDiv = document.getElementById('searchResults');
    if (!resultsDiv) return; 

    resultsDiv.innerHTML = `<div class="searching-message">Buscando ${searchType === 'teams' ? 'times' : searchType === 'players' ? 'jogadores' : 'times e jogadores'}...</div>`;
    try {
        // Passa searchType para searchBrazilianData
        const { teams, players } = await searchBrazilianData(query, searchType); 
        
        let html = '<h2 class="results-title">Resultados da Busca</h2>';
        let foundSomething = false;

        if (searchType === 'all' || searchType === 'teams') {
            if (teams.length > 0) {
                html += `<div class="teams-section"><h3>Times</h3><div class="results-grid">${teams.map(renderTeamCard).join('')}</div></div>`;
                foundSomething = true;
            } else {
                html += `<div class="teams-section"><h3>Times</h3><p class="no-results-message">Nenhum time encontrado para "${query}".</p></div>`;
            }
        }
        if (searchType === 'all' || searchType === 'players') {
            if (players.length > 0) {
                html += `<div class="players-section"><h3>Jogadores</h3><div class="results-grid">${players.map(renderPlayerCard).join('')}</div></div>`;
                foundSomething = true;
            } else {
                html += `<div class="players-section"><h3>Jogadores</h3><p class="no-results-message">Nenhum jogador encontrado para "${query}".</p></div>`;
            }
        }
        
        if (!foundSomething && searchType === 'all') { // Mensagem geral apenas se buscou tudo e não achou nada
             html = `<div class="no-results-found"><h2 class="results-title">Resultados da Busca</h2><p class="no-results-message">Nenhum resultado encontrado para "${query}".</p></div>`;
        } else if (!foundSomething && searchType !== 'all') { // Mensagem específica se buscou tipo único e não achou
             html = `<div class="no-results-found"><h2 class="results-title">Resultados da Busca</h2><p class="no-results-message">Nenhum ${searchType === 'teams' ? 'time' : 'jogador'} encontrado para "${query}".</p></div>`;
        }

        resultsDiv.innerHTML = html;
        syncFavoriteButtons(); 
    } catch (error) {
        const errorMessage = error.message.includes('Limite de requisições diárias atingido')
            ? 'Não foi possível completar a busca. O limite da API foi atingido. Tente novamente amanhã.'
            : `Erro ao carregar resultados: ${error.message}.`;
        resultsDiv.innerHTML = `<div class="error-message">${errorMessage}</div>`;
    }
}

window.handleToggleFavorite = function(type, itemDataString) {
    toggleFavorite(type, itemDataString);
};

document.addEventListener('DOMContentLoaded', () => {
    cleanupExpiredSearchResultsCache(); // Limpa cache de busca ao carregar

    const links = document.querySelectorAll('nav ul li a');
    const currentPagePath = window.location.pathname.split('/').pop() || 'search.html'; 
    links.forEach(link => { link.classList.toggle('active', link.getAttribute('href') === currentPagePath); });

    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const queryInput = document.getElementById('searchInput');
            const query = queryInput ? queryInput.value.trim() : '';
            if (!query) { alert('Por favor, digite algo para pesquisar.'); return; }

            // Determina o tipo de busca pela UI (EXEMPLO: usando radio buttons)
            let searchType = 'all'; // Padrão se não houver seleção
            const typeSelector = document.querySelector('input[name="searchType"]:checked');
            if (typeSelector) {
                searchType = typeSelector.value; // 'all', 'teams', ou 'players'
            }
            
            const currentUrl = new URL(window.location.href); 
            currentUrl.searchParams.set('query', query);
            if (searchType !== 'all') { // Adiciona tipo à URL se não for 'todos'
                currentUrl.searchParams.set('type', searchType);
            } else {
                currentUrl.searchParams.delete('type');
            }
            window.history.pushState({ query: query, type: searchType }, '', currentUrl.toString()); 
            
            await renderSearchResults(query, searchType); // Passa o tipo de busca
        });
    }

    const urlParams = new URLSearchParams(window.location.search);
    const initialQuery = urlParams.get('query');
    const initialType = urlParams.get('type') || 'all'; // Pega o tipo da URL ou padrão 'all'
    
    if (initialQuery) {
        const searchInputField = document.getElementById('searchInput');
        if (searchInputField) { searchInputField.value = initialQuery; }
        
        // Marca o radio button correto se o tipo estiver na URL
        const typeRadioButton = document.querySelector(`input[name="searchType"][value="${initialType}"]`);
        if (typeRadioButton) {
            typeRadioButton.checked = true;
        }

        renderSearchResults(initialQuery, initialType);
    }
    
    window.addEventListener(FAVORITES_CHANGED_EVENT, syncFavoriteButtons);
    window.addEventListener('storage', (e) => { if (e.key === FAVORITES_KEY || e.key.startsWith(SEARCH_RESULTS_CACHE_PREFIX)) { syncFavoriteButtons(); } });
});