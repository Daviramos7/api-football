// Importações
import { fetchFromAPI } from './api.js';
import {
    saveToFavorites,
    isFavorite,
    syncFavoriteButtons
} from './favorites.js';

// Utils básicos
const utils = {
    removeAccents: str => str.normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
    formatCountry: country => country === 'Brazil' ? 'Brasil' : country,
};

// Ligas brasileiras principais
const BRAZILIAN_LEAGUES = [
    { id: 71, name: 'Brasileirão Série A', season: 2025 },
    { id: 72, name: 'Brasileirão Série B', season: 2025 },
    { id: 75, name: 'Brasileirão Série C', season: 2025 },
    { id: 76, name: 'Brasileirão Série D', season: 2025 },
    { id: 73, name: 'Copa do Brasil', season: 2025 }
];

// Busca dados de times e jogadores no Brasil
async function searchBrazilianData(query) {
    const normalizedQuery = utils.removeAccents(query.toLowerCase());
    const results = {
        teams: new Map(),
        players: new Map()
    };

    for (const league of BRAZILIAN_LEAGUES) {
        try {
            // Times
            const teamRes = await fetchFromAPI(`teams?league=${league.id}&season=${league.season}`, 'v3');
            if (teamRes?.response?.length > 0) {
                teamRes.response.forEach(({ team }) => {
                    if (utils.removeAccents(team.name.toLowerCase()).includes(normalizedQuery)) {
                        const teamId = Number(team.id);
                        const existingTeam = results.teams.get(teamId);
                        const leagues = [...new Set([...(existingTeam?.leagues || []), league.name])];

                        results.teams.set(teamId, {
                            id: teamId,
                            name: team.name,
                            logo: team.logo,
                            leagues,
                            city: team.city || 'Brasil',
                            country: utils.formatCountry(team.country),
                            founded: team.founded || null,
                            venue: team.venue || null
                        });
                    }
                });
            }

            // Jogadores
            const playerRes = await fetchFromAPI(
                `players?search=${encodeURIComponent(query)}&league=${league.id}&season=${league.season}`,
                'v3'
            );
            if (playerRes?.response?.length > 0) {
                playerRes.response.forEach(({ player, statistics }) => {
                    if (utils.removeAccents(player.name.toLowerCase()).includes(normalizedQuery)) {
                        const playerId = Number(player.id);
                        const existingPlayer = results.players.get(playerId);
                        const teamInfo = statistics[0]?.team || {
                            name: 'Desconhecido',
                            logo: 'assets/img/player-placeholder.png'
                        };
                        const leagues = [...new Set([...(existingPlayer?.leagues || []), league.name])];

                        results.players.set(playerId, {
                            id: playerId,
                            name: player.name,
                            photo: player.photo,
                            age: player.age,
                            nationality: utils.formatCountry(player.nationality),
                            leagues,
                            team: teamInfo
                        });
                    }
                });
            }
        } catch (error) {
            console.error(`Erro na liga ${league.name}:`, error);
        }
    }

    return {
        teams: Array.from(results.teams.values()).sort((a, b) => a.name.localeCompare(b.name)),
        players: Array.from(results.players.values()).sort((a, b) => a.name.localeCompare(b.name))
    };
}

// Renderiza cartão de time
function renderTeamCard(team) {
    const isFav = isFavorite('teams', team);
    return `
        <div class="card team-card">
            <div class="favorite-button-container">
                <button
                    class="favorite-btn ${isFav ? 'favored' : ''}"
                    onclick="window.addToFavorites('teams', ${JSON.stringify({
                        id: Number(team.id),
                        name: team.name,
                        logo: team.logo,
                        leagues: team.leagues,
                        country: team.country,
                        city: team.city,
                        founded: team.founded,
                        venue: team.venue
                    }).replace(/"/g, '&quot;')})"
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

// Renderiza cartão de jogador
function renderPlayerCard(player) {
    const isFav = isFavorite('players', player);
    return `
        <div class="card player-card">
            <div class="favorite-button-container">
                <button
                    class="favorite-btn ${isFav ? 'favored' : ''}"
                    onclick="window.addToFavorites('players', ${JSON.stringify({
                        id: Number(player.id),
                        name: player.name,
                        photo: player.photo,
                        age: player.age,
                        nationality: player.nationality,
                        leagues: player.leagues,
                        team: player.team
                    }).replace(/"/g, '&quot;')})"
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
                <p>Nacionalidade: ${player.nationality === 'Brazil' ? 'Brasil' : player.nationality}</p>
                <p>Time: ${player.team.name}</p>
                <p>Competições: ${player.leagues.join(', ')}</p>
            </div>
        </div>
    `;
}

// Renderiza resultados na tela
async function renderSearchResults(query) {
    const resultsDiv = document.getElementById('searchResults');
    resultsDiv.innerHTML = '<div class="searching-message">Buscando resultados...</div>';

    try {
        const { teams, players } = await searchBrazilianData(query);

        let html = '<h2 class="results-title">Resultados da Busca</h2>';
        if (teams.length > 0) {
            html += `<div class="teams-section"><h3>Times</h3><div class="results-grid">${teams.map(renderTeamCard).join('')}</div></div>`;
        }
        if (players.length > 0) {
            html += `<div class="players-section"><h3>Jogadores</h3><div class="results-grid">${players.map(renderPlayerCard).join('')}</div></div>`;
        }

        resultsDiv.innerHTML = html || '<div class="no-results">Nenhum resultado encontrado.</div>';
        syncFavoriteButtons();
    } catch (error) {
        console.error('Erro ao buscar resultados:', error);
        resultsDiv.innerHTML = '<div class="no-results">Erro ao carregar resultados.</div>';
    }
}

// Adiciona aos favoritos (acessível no HTML)
window.addToFavorites = function(type, itemData) {
    saveToFavorites(type, itemData);
};

// Atualiza link ativo no menu
document.addEventListener('DOMContentLoaded', () => {
    const links = document.querySelectorAll('nav ul li a');
    const currentPage = window.location.pathname.split('/').pop();

    links.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });

    // Evento de busca
    document.getElementById('searchForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const query = document.getElementById('searchInput').value.trim();
        if (!query) return alert('Digite algo para pesquisar.');
        await renderSearchResults(query);
    });
});