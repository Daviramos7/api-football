// assets/js/main.js
import { fetchFromAPI } from './api.js';
import {
    getFavorites,
    FAVORITES_KEY_FOR_EVENT,
    FAVORITES_CHANGED_EVENT
} from './favorites.js';

// Constante original com todas as ligas para referência futura
const BRAZILIAN_LEAGUES = [
    { id: 71, name: 'Brasileirão Série A', season: 2025 },
    { id: 72, name: 'Brasileirão Série B', season: 2025 },
    { id: 75, name: 'Brasileirão Série C', season: 2025 },
    { id: 76, name: 'Brasileirão Série D', season: 2025 }, 
    { id: 73, name: 'Copa do Brasil', season: 2025 }
];

// DOM elements
const favoriteTeamsContainer = document.getElementById('favoriteTeams');
const favoritePlayersContainer = document.getElementById('favoritePlayers');
const leagueSelect = document.getElementById('leagueSelect');
const groupSelect = document.getElementById('groupSelect');
const standingsList = document.getElementById('standingsList');

// --- Renderiza a seção de favoritos resumidos ---
function renderMainPageFavorites() {
    const fav = getFavorites(); // Pega os favoritos do usuário logado

    if (favoriteTeamsContainer) {
        let teamsHtml = '<h3>Times Favoritos</h3>';
        if (fav.teams && fav.teams.length > 0) {
            teamsHtml += fav.teams.slice(0, 5).map(t => `
                <div class="favorite-card" data-id="${t.id}" data-type="teams">
                    <img src="${t.logo || 'assets/img/team-placeholder.png'}" alt="${t.name}" class="team-favorite-logo" onerror="this.onerror=null; this.src='assets/img/team-placeholder.png'">
                    <div class="favorite-name">${t.name}</div>
                </div>
            `).join('');
        } else {
            teamsHtml += '<p class="no-favorites">Nenhum time favorito.</p>';
        }
        favoriteTeamsContainer.innerHTML = teamsHtml;
    }

    if (favoritePlayersContainer) {
        let playersHtml = '<h3>Jogadores Favoritos</h3>';
        if (fav.players && fav.players.length > 0) {
            playersHtml += fav.players.slice(0, 5).map(p => `
                <div class="favorite-card" data-id="${p.id}" data-type="players">
                    <img src="${p.photo || 'assets/img/player-placeholder.png'}" alt="${p.name}" class="player-favorite-photo" onerror="this.onerror=null; this.src='assets/img/player-placeholder.png'">
                    <div class="favorite-name">${p.name}</div>
                </div>
            `).join('');
        } else {
            playersHtml += '<p class="no-favorites">Nenhum jogador favorito.</p>';
        }
        favoritePlayersContainer.innerHTML = playersHtml;
    }
}

// --- Carrega a tabela de classificação ---
async function loadStandings(leagueId, group = 0) {
    if (!standingsList || !leagueId) {
        if (standingsList) standingsList.innerHTML = '<p class="no-results-message">Selecione uma liga para ver a classificação.</p>';
        return;
    }

    standingsList.innerHTML = '<div class="loading-message">Carregando classificação...</div>';
    
    const leagueConfig = BRAZILIAN_LEAGUES.find(l => l.id === parseInt(leagueId));
    const season = leagueConfig ? leagueConfig.season : new Date().getFullYear();

    // Esta verificação é uma salvaguarda, mas a opção já foi removida do select
    if (parseInt(leagueId) === 73) { 
        standingsList.innerHTML = '<p class="no-results-message">Copa do Brasil tem formato eliminatório, sem tabela de classificação.</p>';
        if (groupSelect) groupSelect.style.display = 'none';
        return;
    }

    const endpoint = `standings?league=${leagueId}&season=${season}`;

    try {
        const data = await fetchFromAPI(endpoint);
        const apiStandingsData = data.response?.[0]?.league?.standings;

        if (!apiStandingsData || apiStandingsData.length === 0) {
            standingsList.innerHTML = '<p class="no-results-message">Nenhuma classificação disponível para esta liga e temporada.</p>';
            if (groupSelect) groupSelect.style.display = 'none';
            return;
        }
        
        let relevantStandings = [];
        const isSerieD = parseInt(leagueId) === 76;
        const isGroupedFormatFromAPI = Array.isArray(apiStandingsData) && apiStandingsData.length > 0 && Array.isArray(apiStandingsData[0]);

        if (isSerieD && isGroupedFormatFromAPI) { 
            if (groupSelect) {
                groupSelect.style.display = 'inline-block';
                if (groupSelect.options.length !== apiStandingsData.length || groupSelect.getAttribute('data-league-id') !== leagueId.toString()) {
                    groupSelect.innerHTML = apiStandingsData.map((groupArray, i) => {
                        const groupName = groupArray[0]?.group || `Grupo ${String.fromCharCode(65 + i)}`;
                        return `<option value="${i}">${groupName}</option>`;
                    }).join('');
                    groupSelect.setAttribute('data-league-id', leagueId.toString());
                }
                groupSelect.value = group.toString();
                relevantStandings = apiStandingsData[group] || [];
            } else {
                 relevantStandings = apiStandingsData[0] || [];
            }
        } else if (isGroupedFormatFromAPI) { 
             relevantStandings = apiStandingsData[0]; 
             if (groupSelect) groupSelect.style.display = 'none';
        } else if (Array.isArray(apiStandingsData)) {
            relevantStandings = apiStandingsData;
            if (groupSelect) groupSelect.style.display = 'none';
        } else {
             standingsList.innerHTML = '<p class="no-results-message">Formato de classificação não reconhecido.</p>';
             if (groupSelect) groupSelect.style.display = 'none';
            return;
        }

        if (!relevantStandings || relevantStandings.length === 0) {
            standingsList.innerHTML = '<p class="no-results-message">Nenhuma classificação disponível para este grupo.</p>';
            return;
        }

        standingsList.innerHTML = `
            <table class="standings-table">
                <thead>
                    <tr><th>#</th><th>Time</th><th>Pts</th><th>J</th><th>V</th><th>E</th><th>D</th><th>SG</th><th>Últ.5</th></tr>
                </thead>
                <tbody>
                    ${relevantStandings.map(r => {
                        const formHtml = r.form ? Array.from(r.form).slice(-5).map(s => {
                            if (s === 'W') return '<span class="form-win">V</span>';
                            if (s === 'D') return '<span class="form-draw">E</span>';
                            if (s === 'L') return '<span class="form-loss">D</span>';
                            return `<span>-</span>`;
                        }).join('') : '-----';
                        return `
                        <tr class="${r.description?.toLowerCase().includes('promotion') ? 'highlight-top' : ''}${r.description?.toLowerCase().includes('relegation') ? ' highlight-bottom' : ''}">
                            <td>${r.rank}</td>
                            <td>
                                <img src="${r.team.logo || 'assets/img/team-placeholder.png'}" class="stand-team-logo" onerror="this.onerror=null; this.src='assets/img/team-placeholder.png'"/>
                                <span class="team-name-in-table">${r.team.name}</span>
                            </td>
                            <td>${r.points}</td>
                            <td>${r.all.played}</td>
                            <td>${r.all.win}</td>
                            <td>${r.all.draw}</td>
                            <td>${r.all.lose}</td>
                            <td>${r.goalsDiff}</td>
                            <td class="form-cell">${formHtml}</td>
                        </tr>
                    `}).join('')}
                </tbody>
            </table>
        `;
    } catch (err) {
        console.error('Erro ao carregar classificação:', err);
        if (standingsList) {
            const defaultMessage = 'Erro ao carregar classificação. Tente novamente mais tarde.';
            let displayMessage = defaultMessage;
            if (typeof err.message === 'string') {
                 if (err.message.includes('Limite de requisições diárias atingido')) {
                    displayMessage = 'Não foi possível carregar a classificação. O limite da API foi atingido.';
                } else if (err.message) {
                    displayMessage = `Erro: ${err.message}`;
                }
            }
            standingsList.innerHTML = `<p class="error-message">${displayMessage}</p>`;
        }
    }
}

// --- Inicialização ---
function init() {
    if (leagueSelect) {
        // Filtra para não incluir a Copa do Brasil (ID 73) no select
        const leaguesForSelect = BRAZILIAN_LEAGUES.filter(league => league.id !== 73);
        
        leagueSelect.innerHTML = leaguesForSelect.map(league =>
            `<option value="${league.id}">${league.name}</option>`
        ).join('');
        
        // Adiciona um placeholder inicial
        const placeholderOption = "<option value=\"\" disabled selected>Selecione uma liga</option>";
        leagueSelect.insertAdjacentHTML('afterbegin', placeholderOption);
        leagueSelect.value = ""; 

        leagueSelect.addEventListener('change', () => {
            const selectedLeagueId = leagueSelect.value;
            if (selectedLeagueId) {
                let initialGroup = (parseInt(selectedLeagueId) === 76) ? 0 : 0;
                loadStandings(selectedLeagueId, initialGroup);
            }
        });

        if (groupSelect) {
             groupSelect.addEventListener('change', () => {
                if (leagueSelect.value) { 
                    loadStandings(leagueSelect.value, parseInt(groupSelect.value));
                }
             });
        }
    }

    renderMainPageFavorites();
    
    // NÃO carrega nenhuma classificação por padrão para economizar API.
    // Exibe mensagem inicial na área de classificação.
    if (standingsList && (!leagueSelect || !leagueSelect.value)) {
        standingsList.innerHTML = '<p class="no-results-message">Selecione uma liga para ver a classificação.</p>';
    }
    if (groupSelect) {
        groupSelect.style.display = 'none';
    }

    window.addEventListener(FAVORITES_CHANGED_EVENT, renderMainPageFavorites);
    window.addEventListener('storage', (e) => {
        if (e.key === FAVORITES_KEY_FOR_EVENT) { // Usando chave de evento se for diferente
            renderMainPageFavorites();
        }
    });

    const links = document.querySelectorAll('nav ul li a');
    const currentPage = window.location.pathname.split('/').pop() || 'main.html';
    links.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === currentPage);
    });
}

document.addEventListener('DOMContentLoaded', init);