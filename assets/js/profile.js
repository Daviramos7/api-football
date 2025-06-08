import { getLoggedUser, updateAuthUser, logout, showModalMessage } from './auth.js';
import { 
    getFavorites, 
    removeFromFavoritesOnPage, 
    FAVORITES_CHANGED_EVENT,
    FAVORITES_KEY_FOR_EVENT
} from './favorites.js';

function renderFavoritePlayerCard(player) {
    return `
        <div class="card player-card" data-id="${player.id}" data-type="players">
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
            <button class="remove-btn" onclick="window.handleProfileRemoveFavorite('players', '${player.id}')">Remover dos Favoritos</button>
        </div>
    `;
}

function renderFavoriteTeamCard(team) {
    return `
        <div class="card team-card" data-id="${team.id}" data-type="teams">
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
            <button class="remove-btn" onclick="window.handleProfileRemoveFavorite('teams', '${team.id}')">Remover dos Favoritos</button>
        </div>
    `;
}

function loadUserProfile() {
    const loggedUser = getLoggedUser();
    if (loggedUser) {
        document.getElementById('profileUserId').value = loggedUser.id;
        document.getElementById('profileUsername').value = loggedUser.name;
        document.getElementById('profileEmail').value = loggedUser.email;
        document.getElementById('profileCity').value = loggedUser.city || '';
        document.getElementById('profileCountry').value = loggedUser.country || '';
        document.getElementById('profileRole').value = loggedUser.role || 'Usuário Padrão';
    } else {
        showModalMessage('Você precisa estar logado para acessar esta página.', () => {
            window.location.href = 'login.html';
        });
    }
}

function loadFavoritesOnProfile() {
    const loggedUser = getLoggedUser();
    if (!loggedUser) return;

    const favorites = getFavorites();
    
    const teamsContainer = document.getElementById('favoriteTeams');
    if (teamsContainer) {
        if (favorites.teams && favorites.teams.length > 0) {
            teamsContainer.innerHTML = favorites.teams.map(renderFavoriteTeamCard).join('');
        } else {
            teamsContainer.innerHTML = '<p class="no-favorites">Nenhum time favorito adicionado.</p>';
        }
    }

    const playersContainer = document.getElementById('favoritePlayers');
    if (playersContainer) {
        if (favorites.players && favorites.players.length > 0) {
            playersContainer.innerHTML = favorites.players.map(renderFavoritePlayerCard).join('');
        } else {
            playersContainer.innerHTML = '<p class="no-favorites">Nenhum jogador favorito adicionado.</p>';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile(); 
    loadFavoritesOnProfile();

    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', (event) => {
            event.preventDefault();

            const loggedUser = getLoggedUser();
            if (!loggedUser) {
                showModalMessage('Erro: Nenhum usuário logado para salvar o perfil.');
                return;
            }

            const userId = document.getElementById('profileUserId').value;
            const username = document.getElementById('profileUsername').value;
            const newPassword = document.getElementById('profilePassword').value;
            const city = document.getElementById('profileCity').value;
            const country = document.getElementById('profileCountry').value;
            
            const userDataToUpdate = {
                id: parseInt(userId),
                name: username,
                email: loggedUser.email, 
                password: newPassword ? newPassword : undefined, 
                city: city,
                country: country,
                role: loggedUser.role 
            };
            
            if (updateAuthUser(userDataToUpdate)) {
                 showModalMessage('Dados do perfil salvos com sucesso!');
                 loadUserProfile(); 
                 const profilePasswordField = document.getElementById('profilePassword');
                 if (profilePasswordField) {
                    profilePasswordField.value = '';
                 }
            } else {
                showModalMessage('Erro ao salvar os dados do perfil.');
            }
        });
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    window.addEventListener(FAVORITES_CHANGED_EVENT, loadFavoritesOnProfile);
    window.addEventListener('storage', (e) => {
        if (e.key === 'users') { 
            loadFavoritesOnProfile();
        }
    });

    const links = document.querySelectorAll('nav ul li a');
    const currentPage = window.location.pathname.split('/').pop() || 'profile.html';
    links.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === currentPage);
    });
});

window.handleProfileRemoveFavorite = (type, itemId) => {
    if (confirm(`Tem certeza que deseja remover este ${type === 'teams' ? 'time' : 'jogador'} dos favoritos?`)) {
        removeFromFavoritesOnPage(type, itemId, 'profilePage');
    }
};