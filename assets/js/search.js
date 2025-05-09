// Import from api.js
import { fetchFromAPI } from './api.js';
import { 
    saveToFavorites, 
    isFavorite, 
    updateFavoriteButton, 
    syncFavoriteButtons, 
    FAVORITES_CHANGED_EVENT 
} from './favorites.js';

const utils = {
    removeAccents: str => str.normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
    formatCountry: country => country === 'Brazil' ? 'Brasil' : country,
    addLeague: (leagues, leagueName) => {
        if (!leagues.includes(leagueName)) {
            leagues.push(leagueName);
        }
        return leagues;
    }
};

// Ligas principais do Brasil com IDs de ambas as versões
const BRAZILIAN_LEAGUES = [
    {
        id: { v3: 71, v2: 7079 },
        name: 'Brasileirão Série A',
        season: 2025,
        startDate: '2025-03-29',
        endDate: '2025-12-21'
    },
    {
        id: { v3: 72, v2: 7093 },
        name: 'Brasileirão Série B',
        season: 2025,
        startDate: '2025-04-04',
        endDate: '2025-11-22'
    },
    {
        id: { v3: 75, v2: 7124 },
        name: 'Brasileirão Série C',
        season: 2025,
        startDate: '2025-04-12',
        endDate: '2025-08-31'
    },
    {
        id: { v3: 76, v2: 7123 },
        name: 'Brasileirão Série D',
        season: 2025,
        startDate: '2025-04-12',
        endDate: '2025-07-19'
    },
    {
        id: { v3: 73, v2: 7069 },
        name: 'Copa do Brasil',
        season: 2025,
        startDate: '2025-02-18',
        endDate: '2025-05-20'
    }
];

async function searchBrazilianData(query) {
    const results = {
        players: new Map(),
        teams: new Map()
    };

    const normalizedQuery = utils.removeAccents(query.toLowerCase());

    for (const league of BRAZILIAN_LEAGUES) {
        try {
            // Busca de times
            const teamsData = await fetchFromAPI(`teams?league=${league.id.v3}&season=${league.season}`, 'v3');

            teamsData?.response?.forEach(({ team }) => {
                if (utils.removeAccents(team.name.toLowerCase()).includes(normalizedQuery)) {
                    const teamId = team.id.toString();
                    const existingTeam = results.teams.get(teamId);

                    results.teams.set(teamId, {
                        ...existingTeam,
                        id: team.id,
                        name: team.name,
                        logo: team.logo,
                        leagues: utils.addLeague(existingTeam?.leagues || [], league.name),
                        venue: team.venue || null,
                        founded: team.founded || null,
                        country: utils.formatCountry(team.country),
                        city: team.city || 'Brasil'
                    });
                }
            });

            // Busca de jogadores
            const playersData = await fetchFromAPI(
                `players?search=${encodeURIComponent(query)}&league=${league.id.v3}&season=${league.season}`,
                'v3'
            );

            playersData?.response?.forEach(({ player, statistics }) => {
                if (utils.removeAccents(player.name.toLowerCase()).includes(normalizedQuery)) {
                    const playerId = player.id.toString();
                    const existingPlayer = results.players.get(playerId);
                    const teamInfo = statistics?.[0]?.team || {
                        name: 'Time não informado',
                        logo: 'assets/img/player-placeholder.png'
                    };

                    results.players.set(playerId, {
                        ...existingPlayer,
                        id: playerId,
                        name: player.name,
                        photo: player.photo,
                        age: player.age,
                        nationality: player.nationality,
                        leagues: utils.addLeague(existingPlayer?.leagues || [], league.name),
                        team: teamInfo
                    });
                }
            });

        } catch (error) {
            console.error(`Erro ao buscar dados na liga ${league.name}:`, error);
        }
    }

    // Convertendo o Map para array e ordenando
    const teamsList = Array.from(results.teams.values()).sort((a, b) => 
        a.name.localeCompare(b.name)
    );
    const playersList = Array.from(results.players.values());

    return { 
        teams: teamsList,
        players: playersList
    };
}

function renderTeamCard(team) {
    // Verifica o status atual do favorito antes de renderizar
    const isFav = isFavorite('teams', team);
    return `
        <div class="card team-card">
            <div class="favorite-button-container">
                <button
                    class="favorite-btn ${isFav ? 'favored' : ''}"
                    onclick="window.addToFavorites('teams', ${JSON.stringify(team).replace(/"/g, '&quot;')})"
                    data-type="teams"
                    data-id="${team.id}"
                >
                    ★
                </button>
            </div>
            <div class="team-header">
                <img src="${team.logo}" alt="${team.name}" class="team-logo">
            </div>
            <div class="team-info">
                <h3>${team.name}</h3>
                <p class="team-location">${team.city !== 'Brasil' ? `${team.city}, ` : ''}${team.country}</p>
                <p class="team-leagues">Competições: ${team.leagues.join(', ')}</p>
                ${team.founded ? `<p>Fundado em: ${team.founded}</p>` : ''}
                ${team.venue ? 
                    `<div class="venue-info">
                        <p>Estádio: ${team.venue.name || 'Não informado'}</p>
                        <p>Capacidade: ${team.venue.capacity ? team.venue.capacity.toLocaleString() : 'Não informada'}</p>
                    </div>` 
                 : ''}
            </div>
        </div>
    `;
}

function renderPlayerCard(player) {
    // Verifica o status atual do favorito antes de renderizar
    const isFav = isFavorite('players', player);
    return `
        <div class="card player-card">
            <div class="favorite-button-container">
                <button
                    class="favorite-btn ${isFav ? 'favored' : ''}"
                    onclick="window.addToFavorites('players', ${JSON.stringify(player).replace(/"/g, '&quot;')})"
                    data-type="players"
                    data-id="${player.id}"
                >
                    ★
                </button>
            </div>
            <div class="player-photo-container">
                <img src="${player.photo}" alt="${player.name}" class="player-photo" onerror="this.src='assets/img/player-placeholder.png'">
                ${player.team?.logo ?
                    `<img src="${player.team.logo}" alt="${player.team.name}" class="team-logo-overlay" onerror="this.src='assets/img/team-placeholder.png'">` 
                    : ''}
            </div>
            <div class="player-info">
                <h3>${player.name}</h3>
                <p>Idade: ${player.age}</p>
                <p>Nacionalidade: ${utils.formatCountry(player.nationality)}</p>
                <p>Time: ${player.team?.name || 'Não informado'}</p>
                <p>Competições: ${player.leagues.join(', ')}</p>
            </div>
        </div>
    `;
}

async function renderSearchResults(query) {
    const resultsDiv = document.getElementById('searchResults');
    resultsDiv.innerHTML = '<div class="searching-message">Buscando resultados...</div>';

    try {
        const { players, teams } = await searchBrazilianData(query);

        if ((!players || players.length === 0) && (!teams || teams.length === 0)) {
            resultsDiv.innerHTML = '<div class="no-results">Nenhum resultado encontrado, por favor recarregue a página.</div>';
            return;
        }

        let teamsHTML = '';
        if (teams && teams.length > 0) {
            teamsHTML = `
                <div class="teams-section">
                    <h3>Times</h3>
                    <div class="results-grid">
                        ${teams.map(team => renderTeamCard(team)).join('')}
                    </div>
                </div>
            `;
        }

        let playersHTML = '';
        if (players && players.length > 0) {
            playersHTML = `
                <div class="players-section">
                    <h3>Jogadores</h3>
                    <div class="results-grid">
                        ${players.map(player => renderPlayerCard(player)).join('')}
                    </div>
                </div>
            `;
        }

        resultsDiv.innerHTML = `
            <h2 class="results-title">Resultados da Busca</h2>
            ${teamsHTML}
            ${playersHTML}
        `;
        
        // Sincroniza o estado dos botões após renderizar os resultados
        syncFavoriteButtons();
        console.log('Resultados de busca renderizados, botões sincronizados');
    } catch (error) {
        console.error('Erro ao processar resultados:', error);
        resultsDiv.innerHTML = '<div class="no-results">Erro ao processar resultados.</div>';
    }
}

// Add to window to be accessible from HTML
window.addToFavorites = function(type, itemData) {
    console.log(`Adicionando aos favoritos: ${type}:${itemData.id}`);
    saveToFavorites(type, itemData);
};

// Ouvinte para alterações em favoritos em outras páginas/abas
window.addEventListener('storage', (event) => {
    if (event.key === 'footballFavorites') {
        console.log('Evento storage detectado na página de busca');
        // Sincroniza os botões quando o localStorage muda (de outra aba)
        syncFavoriteButtons();
    }
});

// Ouvinte para o evento personalizado dentro da mesma página
window.addEventListener(FAVORITES_CHANGED_EVENT, () => {
    console.log('Evento FAVORITES_CHANGED_EVENT detectado na página de busca');
    syncFavoriteButtons();
});

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado na página de busca - inicializando');
    
    // Inicializa o estado dos botões de favorito
    syncFavoriteButtons();
    
    document.getElementById('searchForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const query = document.getElementById('searchInput').value.trim();
        if (!query) return alert('Por favor, digite um termo para buscar');
        await renderSearchResults(query);
    });
});