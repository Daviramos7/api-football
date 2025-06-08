import { getFavorites, removeFromFavoritesOnPage, FAVORITES_CHANGED_EVENT } from './favorites.js';
import { getLoggedUser, showModalMessage } from './auth.js';

function renderFavoritePlayerCard(player) {
    return `
    <div class="card favorite-card player-card" data-id="${player.id}" data-type="players">
        <div class="player-photo-container">
            <img src="${player.photo || 'assets/img/player-placeholder.png'}" alt="${player.name}" class="player-photo" onerror="this.onerror=null; this.src='assets/img/player-placeholder.png'">
            ${player.team?.logo ?
                `<img src="${player.team.logo}" alt="${player.team.name || ''}" class="team-logo-overlay" onerror="this.onerror=null; this.src='assets/img/team-placeholder.png'">`
                : ''}
        </div>
        <div class="player-info">
            <h3>${player.name}</h3>
            <p>Idade: ${player.age || 'Não informada'}</p>
            <p>Nacionalidade: ${player.nationality || 'Não informada'}</p>
            <p>Time: ${player.team?.name || 'Não informado'}</p>
            <p>Competições Salvas: ${Array.isArray(player.leagues) ? player.leagues.join(', ') : (player.leagues || 'Não informado')}</p>
        </div>
        <button class="remove-btn" onclick="window.handlePageRemoveFavorite('players', '${player.id}')">Remover</button>
    </div>`;
}

function renderFavoriteTeamCard(team) {
    return `
    <div class="card favorite-card team-card" data-id="${team.id}" data-type="teams">
        <div class="team-header">
            <img src="${team.logo || 'assets/img/team-placeholder.png'}"
                 alt="${team.name}"
                 class="team-logo"
                 onerror="this.onerror=null; this.src='assets/img/team-placeholder.png'">
        </div>
        <div class="team-info">
            <h3>${team.name}</h3>
            <p class="team-location">${team.city && team.city !== 'Brasil' ? `${team.city}, ` : ''}${team.country || 'Brasil'}</p>
            <p class="team-leagues">Competições Salvas: ${Array.isArray(team.leagues) ? team.leagues.join(', ') : (team.leagues || 'Não informado')}</p>
        </div>
        <button class="remove-btn" onclick="window.handlePageRemoveFavorite('teams', '${team.id}')">Remover</button>
    </div>`;
}

function loadAndDisplayFavoritesOnPage() {
    const loggedUser = getLoggedUser();
    const teamsContainer = document.getElementById('favoriteTeams');
    const playersContainer = document.getElementById('favoritePlayers');

    if (!teamsContainer || !playersContainer) {
        console.error("Elementos 'favoriteTeams' ou 'favoritePlayers' não encontrados no DOM.");
        return;
    }

    if (!loggedUser) {
        teamsContainer.innerHTML = '<p class="no-favorites">Você precisa estar <a href="login.html">logado</a> para ver seus favoritos.</p>';
        playersContainer.innerHTML = ''; 
        return;
    }

    const favorites = getFavorites();

    if (favorites.teams && favorites.teams.length > 0) {
        teamsContainer.innerHTML = favorites.teams.map(renderFavoriteTeamCard).join('');
    } else {
        teamsContainer.innerHTML = '<p class="no-favorites">Nenhum time favorito adicionado.</p>';
    }

    if (favorites.players && favorites.players.length > 0) {
        playersContainer.innerHTML = favorites.players.map(renderFavoritePlayerCard).join('');
    } else {
        playersContainer.innerHTML = '<p class="no-favorites">Nenhum jogador favorito adicionado.</p>';
    }
}

window.handlePageRemoveFavorite = (type, itemId) => {
    if (confirm(`Tem certeza que deseja remover este ${type === 'teams' ? 'time' : 'jogador'} dos favoritos?`)) {
        removeFromFavoritesOnPage(type, itemId, 'favoritesPage');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    loadAndDisplayFavoritesOnPage();

    const links = document.querySelectorAll('nav ul li a');
    const currentPage = window.location.pathname.split('/').pop() || 'favorites.html';
    links.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === currentPage);
    });
});

window.addEventListener(FAVORITES_CHANGED_EVENT, loadAndDisplayFavoritesOnPage);
window.addEventListener('storage', (e) => {
    if (e.key === 'users') {
        loadAndDisplayFavoritesOnPage();
    }
});