// assets/js/main.js
import { fetchFromAPI } from './api.js';
import {
    getFavorites,
    FAVORITES_KEY,
    FAVORITES_CHANGED_EVENT
} from './favorites.js';
// import { showModalMessage } from './auth.js'; // Descomente se for usar modais nesta página

const BRAZILIAN_LEAGUES = [
    { id: 71, name: 'Brasileirão Série A', season: 2025 },
    { id: 72, name: 'Brasileirão Série B', season: 2025 },
    { id: 75, name: 'Brasileirão Série C', season: 2025 },
    { id: 76, name: 'Brasileirão Série D', season: 2025 },
    { id: 73, name: 'Copa do Brasil', season: 2025 } // Mantida aqui para referência, mas filtrada do select
];

// DOM elements
const favoriteTeamsContainer = document.getElementById('favoriteTeams');
const favoritePlayersContainer = document.getElementById('favoritePlayers');
const leagueSelect = document.getElementById('leagueSelect');
const groupSelect = document.getElementById('groupSelect');
const standingsList = document.getElementById('standingsList');

// --- Funções de Renderização de Favoritos (Resumidos na Página Principal) ---
// (Como na mensagem #95 - sem links para detalhes)
function renderMainPageFavorites() {
    const fav = getFavorites();
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

// --- Funções de Carregamento de Classificação ---
// (Como na mensagem #95 - com lógica de grupos para Série D e sem links para detalhes de time)
async function loadStandings(leagueId, group = 0) {
    if (!standingsList || !leagueId) {
        if (standingsList) standingsList.innerHTML = '<p class="no-results-message">Selecione uma liga para ver a classificação.</p>';
        return;
    }

    standingsList.innerHTML = '<div class="loading-message">Carregando classificação...</div>';
    
    const leagueConfig = BRAZILIAN_LEAGUES.find(l => l.id === parseInt(leagueId));
    const season = leagueConfig ? leagueConfig.season : new Date().getFullYear();

    if (parseInt(leagueId) === 73) {
        standingsList.innerHTML = '<p class="no-results-message">Copa do Brasil tem formato eliminatório, sem tabela de classificação por pontos corridos.</p>';
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
                
                const currentSelectedGroup = parseInt(groupSelect.value);
                if(group >= 0 && group < apiStandingsData.length) {
                    groupSelect.value = group.toString(); // Garante que o grupo passado como parâmetro seja selecionado
                    relevantStandings = apiStandingsData[group] || [];
                } else if (currentSelectedGroup >= 0 && currentSelectedGroup < apiStandingsData.length) {
                    relevantStandings = apiStandingsData[currentSelectedGroup] || [];
                } else {
                     relevantStandings = apiStandingsData[0] || []; 
                     groupSelect.value = "0";
                }
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
            standingsList.innerHTML = '<p class="no-results-message">Nenhuma classificação disponível para este grupo ou liga.</p>';
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
                    displayMessage = `Erro ao carregar classificação: ${err.message}.`;
                }
            }
            standingsList.innerHTML = `<p class="error-message">${displayMessage}</p>`;
        }
    }
}

// --- Inicialização ---
function init() {
    if (leagueSelect) {
        const leaguesForSelect = BRAZILIAN_LEAGUES.filter(league => league.id !== 73); // Exclui Copa do Brasil
        
        leagueSelect.innerHTML = leaguesForSelect.map(league =>
            `<option value="${league.id}">${league.name}</option>`
        ).join('');
        
        // Adiciona uma opção placeholder inicial e a seleciona
        const placeholderOption = "<option value=\"\" disabled selected>Selecione uma liga</option>";
        leagueSelect.insertAdjacentHTML('afterbegin', placeholderOption);
        leagueSelect.value = ""; // Garante que o placeholder esteja selecionado

        leagueSelect.addEventListener('change', () => {
            const selectedLeagueId = leagueSelect.value;
            if (selectedLeagueId) { // Só carrega se uma liga real for selecionada
                let initialGroup = 0; 
                if (parseInt(selectedLeagueId) === 76) {
                    // Para Série D, o groupSelect será populado em loadStandings.
                    // Podemos carregar o grupo 0 por padrão ao selecionar Série D.
                    if (groupSelect) groupSelect.value = "0"; // Tenta resetar visualmente o select de grupo
                }
                loadStandings(selectedLeagueId, initialGroup);
            } else {
                // Se o placeholder "Selecione uma liga" for re-selecionado (improvável sem JS extra)
                // ou se nenhuma liga for selecionada inicialmente.
                if (standingsList) standingsList.innerHTML = '<p class="no-results-message">Selecione uma liga para ver a classificação.</p>';
                if (groupSelect) groupSelect.style.display = 'none';
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
    
    // NÃO carrega nenhuma classificação por padrão.
    // Exibe mensagem inicial na área de classificação.
    if (standingsList && (!leagueSelect || !leagueSelect.value)) {
        standingsList.innerHTML = '<p class="no-results-message">Selecione uma liga para ver a classificação.</p>';
    }
    if (groupSelect) { // Garante que o seletor de grupo esteja escondido inicialmente
        groupSelect.style.display = 'none';
    }


    window.addEventListener(FAVORITES_CHANGED_EVENT, renderMainPageFavorites);
    window.addEventListener('storage', (e) => {
        if (e.key === FAVORITES_KEY) {
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