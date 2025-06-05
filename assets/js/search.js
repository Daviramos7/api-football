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
    formatCountry: country => country?.toLowerCase() === 'brazil' ? 'Brasil' : country,
};

const SEARCH_RESULTS_CACHE_PREFIX = 'search_futebol_results_cache_';
const SEARCH_CACHE_DURATION_MS = 1000 * 60 * 30; // 30 minutos

function cleanupExpiredSearchResultsCache() {
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(SEARCH_RESULTS_CACHE_PREFIX)) {
            try {
                const item = JSON.parse(localStorage.getItem(key));
                if (item.timestamp < Date.now() - SEARCH_CACHE_DURATION_MS) {
                    localStorage.removeItem(key);
                }
            } catch (e) { localStorage.removeItem(key); }
        }
    }
}

async function searchBrazilianData(query) {
    const normalizedQuery = utils.removeAccents(query.toLowerCase());
    const currentYear = new Date().getFullYear();
    // A chave do cache não precisa mais do tipo de busca
    const cacheKey = `${SEARCH_RESULTS_CACHE_PREFIX}${normalizedQuery}`;

    // 1. Verificando o cache no localStorage
    try {
        const cachedItemString = localStorage.getItem(cacheKey);
        if (cachedItemString) {
            const cachedItem = JSON.parse(cachedItemString);
            if (cachedItem.timestamp > Date.now() - SEARCH_CACHE_DURATION_MS) {
                console.log(`Resultados para "${query}" servidos do cache.`);
                return cachedItem.data;
            } else {
                localStorage.removeItem(cacheKey);
            }
        }
    } catch (e) {
        console.error("Erro ao ler cache de busca:", e);
        localStorage.removeItem(cacheKey);
    }
    
    const results = { teams: new Map(), players: new Map() };
    const searchingMessageDiv = document.getElementById('searchResults');

    try {
        // --- Sempre busca por TIMES ---
        if (searchingMessageDiv) searchingMessageDiv.innerHTML = `<div class="searching-message">Buscando times...</div>`;
        const teamSearchTerm = encodeURIComponent(query);
        const teamRes = await fetchFromAPI(`teams?country=Brazil&search=${teamSearchTerm}`);
        
        if (teamRes?.response?.length > 0) {
            teamRes.response.forEach(({ team, venue }) => {
                const countryLower = team.country?.toLowerCase();
                if ((countryLower === 'brazil' || countryLower === 'brasil') && utils.removeAccents(team.name.toLowerCase()).includes(normalizedQuery)) {
                    const teamId = Number(team.id);
                    if (isNaN(teamId)) return;
                    results.teams.set(teamId, { id: teamId, name: team.name, logo: team.logo, country: utils.formatCountry(team.country), city: team.city || 'Não informada', founded: team.founded, venue: venue, leagues: ["Nacional"] });
                }
            });
        }

        // --- Sempre busca por JOGADORES ---
        if (searchingMessageDiv) searchingMessageDiv.innerHTML = `<div class="searching-message">Buscando jogadores...</div>`;
        const playerSearchTerm = encodeURIComponent(query);
        const playerRes = await fetchFromAPI(`players?search=${playerSearchTerm}&season=${currentYear}`);

        if (playerRes?.response?.length > 0) {
            playerRes.response.forEach(({ player, statistics }) => {
                const nationalLower = player.nationality?.toLowerCase();
                const latestStat = statistics?.[0];
                const teamCountryLower = latestStat?.team?.country?.toLowerCase();
                const leagueCountryLower = latestStat?.league?.country?.toLowerCase();
                const isBrazilianNational = (nationalLower === 'brazil' || nationalLower === 'brasil');
                const playsInBrazil = (teamCountryLower === 'brazil' || teamCountryLower === 'brasil' || leagueCountryLower === 'brazil' || leagueCountryLower === 'brasil');

                if ((isBrazilianNational || playsInBrazil) && utils.removeAccents(player.name.toLowerCase()).includes(normalizedQuery)) {
                    const playerId = Number(player.id);
                    if (isNaN(playerId)) return;
                    const teamInfo = latestStat?.team || { name: 'Clube não informado', logo: null };
                    const leagueInfo = latestStat?.league || { name: 'Liga não informada' };
                    results.players.set(playerId, { id: playerId, name: player.name, photo: player.photo, age: player.age, nationality: utils.formatCountry(player.nationality), team: { id: Number(teamInfo.id), name: teamInfo.name, logo: teamInfo.logo }, leagues: [leagueInfo.name] });
                }
            });
        }
    } catch (error) {
        console.error(`Erro durante a busca por "${query}":`, error);
        if (searchingMessageDiv && error.message.includes('Limite de requisições diárias atingido')) {
            throw error;
        }
    }

    const finalResults = {
        teams: Array.from(results.teams.values()).sort((a, b) => a.name.localeCompare(b.name)),
        players: Array.from(results.players.values()).sort((a, b) => a.name.localeCompare(b.name))
    };
    
    if (finalResults.teams.length > 0 || finalResults.players.length > 0) {
        const itemToCache = { data: finalResults, timestamp: Date.now() };
        try {
            localStorage.setItem(cacheKey, JSON.stringify(itemToCache));
        } catch (e) {
            console.error(`Erro ao salvar resultados no localStorage:`, e);
        }
    }
    
    return finalResults;
}

// --- Funções de Renderização (sem links para detalhes) ---
function renderTeamCard(team) {
    const isFav = isFavorite('teams', { id: team.id });
    const teamDataString = JSON.stringify({ id: team.id, name: team.name, logo: team.logo || 'assets/img/team-placeholder.png', leagues: team.leagues, country: team.country, city: team.city, founded: team.founded, venue: team.venue }).replace(/"/g, '&quot;');
    return `<div class="card team-card" data-id="${team.id}" data-type="teams"><div class="favorite-button-container"><button class="favorite-btn ${isFav ? 'favored' : ''}" onclick="window.handleToggleFavorite('teams', ${teamDataString})" data-type="teams" data-id="${team.id}" aria-label="Favoritar ${team.name}">★</button></div><div class="team-header"><img src="${team.logo || 'assets/img/team-placeholder.png'}" alt="Logo do ${team.name}" class="team-logo" onerror="this.onerror=null; this.src='assets/img/team-placeholder.png'"></div><div class="team-info"><h3>${team.name}</h3></div></div>`;
}

function renderPlayerCard(player) {
    const isFav = isFavorite('players', { id: player.id });
    const playerDataString = JSON.stringify({ id: player.id, name: player.name, photo: player.photo || 'assets/img/player-placeholder.png', age: player.age, nationality: player.nationality, leagues: player.leagues, team: player.team }).replace(/"/g, '&quot;');
    return `<div class="card player-card" data-id="${player.id}" data-type="players"><div class="favorite-button-container"><button class="favorite-btn ${isFav ? 'favored' : ''}" onclick="window.handleToggleFavorite('players', ${playerDataString})" data-type="players" data-id="${player.id}" aria-label="Favoritar ${player.name}">★</button></div><div class="player-photo-container"><img src="${player.photo || 'assets/img/player-placeholder.png'}" alt="Foto de ${player.name}" class="player-photo" onerror="this.onerror=null; this.src='assets/img/player-placeholder.png'">${player.team?.logo ? `<img src="${player.team.logo}" alt="${player.team.name || ''}" class="team-logo-overlay" onerror="this.onerror=null; this.src='assets/img/team-placeholder.png'">` : ''}</div><div class="player-info"><h3>${player.name}</h3></div></div>`;
}

async function renderSearchResults(query) {
    const resultsDiv = document.getElementById('searchResults');
    if (!resultsDiv) return; 

    resultsDiv.innerHTML = `<div class="searching-message">Buscando times e jogadores...</div>`;
    try {
        const { teams, players } = await searchBrazilianData(query); 
        
        let html = '<h2 class="results-title">Resultados da Busca</h2>';
        if (teams.length === 0 && players.length === 0) {
            html = `<div class="no-results-found"><h2 class="results-title">Resultados da Busca</h2><p class="no-results-message">Nenhum resultado encontrado para "${query}".</p></div>`;
        } else {
            html += `<div class="teams-section"><h3>Times</h3>`;
            if (teams.length > 0) {
                html += `<div class="results-grid">${teams.map(renderTeamCard).join('')}</div>`;
            } else {
                html += `<p class="no-results-message">Nenhum time encontrado para "${query}".</p>`;
            }
            html += `</div>`;

            html += `<div class="players-section"><h3>Jogadores</h3>`;
            if (players.length > 0) {
                html += `<div class="results-grid">${players.map(renderPlayerCard).join('')}</div>`;
            } else {
                html += `<p class="no-results-message">Nenhum jogador encontrado para "${query}".</p>`;
            }
            html += `</div>`;
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
    cleanupExpiredSearchResultsCache(); 

    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const queryInput = document.getElementById('searchInput');
            const query = queryInput ? queryInput.value.trim() : '';
            if (!query) { alert('Por favor, digite algo para pesquisar.'); return; }
            
            // Lógica de tipo de busca foi removida
            const currentUrl = new URL(window.location.href); 
            currentUrl.searchParams.set('query', query);
            currentUrl.searchParams.delete('type'); // Remove o parâmetro 'type' se existir
            window.history.pushState({ query: query }, '', currentUrl.toString()); 
            
            await renderSearchResults(query);
        });
    }

    const urlParams = new URLSearchParams(window.location.search);
    const initialQuery = urlParams.get('query');
    if (initialQuery) {
        const searchInputField = document.getElementById('searchInput');
        if (searchInputField) { searchInputField.value = initialQuery; }
        renderSearchResults(initialQuery);
    }
    
    const links = document.querySelectorAll('nav ul li a');
    const currentPagePath = window.location.pathname.split('/').pop() || 'search.html'; 
    links.forEach(link => { link.classList.toggle('active', link.getAttribute('href') === currentPagePath); });
    window.addEventListener(FAVORITES_CHANGED_EVENT, syncFavoriteButtons);
    window.addEventListener('storage', (e) => { if (e.key === FAVORITES_KEY || e.key.startsWith(SEARCH_RESULTS_CACHE_PREFIX)) { syncFavoriteButtons(); } });
});