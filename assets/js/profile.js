// assets/js/profile.js
import { getLoggedUser, addOrUpdateUser, logout, showModalMessage, updateAuthUser } from './auth.js';
import { 
    getFavorites, 
    removeFromFavoritesOnPage, // Usaremos esta para o contexto da página
    FAVORITES_KEY, 
    FAVORITES_CHANGED_EVENT 
} from './favorites.js';

// Funções para renderizar os cards de favoritos (sem links para detalhes)
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
        const profileUserIdField = document.getElementById('profileUserId');
        const profileUsernameField = document.getElementById('profileUsername');
        const profileEmailField = document.getElementById('profileEmail');
        const profileCityField = document.getElementById('profileCity');
        const profileCountryField = document.getElementById('profileCountry');
        const profileRoleField = document.getElementById('profileRole');

        if (profileUserIdField) profileUserIdField.value = loggedUser.id;
        if (profileUsernameField) profileUsernameField.value = loggedUser.name;
        if (profileEmailField) profileEmailField.value = loggedUser.email;
        if (profileCityField) profileCityField.value = loggedUser.city || '';
        if (profileCountryField) profileCountryField.value = loggedUser.country || '';
        if (profileRoleField) profileRoleField.value = loggedUser.role || 'Usuário Padrão';
    } else {
        showModalMessage('Você precisa estar logado para acessar esta página.', () => {
            window.location.href = 'login.html';
        });
    }
}

function loadFavoritesOnProfile() {
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
                email: loggedUser.email, // Email não é editável no formulário
                password: newPassword ? newPassword : undefined, // Envia apenas se uma nova senha for digitada
                city: city,
                country: country,
                role: loggedUser.role // Papel não é editável no formulário de perfil
            };
            
            if (updateAuthUser(userDataToUpdate)) { // updateAuthUser também atualiza a sessão
                 showModalMessage('Dados do perfil salvos com sucesso!');
                 loadUserProfile(); // Recarrega dados do perfil no formulário
                 const profilePasswordField = document.getElementById('profilePassword');
                 if (profilePasswordField) {
                    profilePasswordField.value = ''; // Limpa o campo de senha
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
        if (e.key === FAVORITES_KEY) { 
            loadFavoritesOnProfile();
        }
    });

    // Adiciona o link ativo na navegação
    const links = document.querySelectorAll('nav ul li a');
    const currentPage = window.location.pathname.split('/').pop() || 'profile.html';
    links.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === currentPage);
    });
});

// Função global para ser chamada pelos botões "Remover" nos cards de favoritos desta página
window.handleProfileRemoveFavorite = (type, itemId) => {
    if (confirm(`Tem certeza que deseja remover este ${type === 'teams' ? 'time' : 'jogador'} dos favoritos?`)) {
        removeFromFavoritesOnPage(type, itemId, 'profilePage'); // Passa o contexto da página
    }
};