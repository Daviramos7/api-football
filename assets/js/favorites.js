// assets/js/profile.js
// Importa tudo o que é necessário de auth.js, incluindo as chaves e as funções de favoritos
import { 
    getLoggedUser, 
    addOrUpdateUser, 
    logout, 
    getFavorites, 
    removeFromFavorites, 
    showModalMessage, 
    FAVORITES_CHANGED_EVENT, // Importa a constante do auth.js
    FAVORITES_KEY           // Importa a constante do auth.js
} from './auth.js'; 

// Funções para renderizar os cards de favoritos (mantidas aqui no profile.js)
function renderFavoritePlayerCard(player) {
    return `
        <div class="card player-card" data-id="${player.id}">
            <div class="player-photo-container">
                <img src="${player.photo || 'assets/img/player-placeholder.png'}" alt="${player.name}" class="player-photo" onerror="this.onerror=null; this.src='assets/img/player-placeholder.png'">
                ${player.team?.logo ?
                    `<img src="${player.team.logo}" alt="${player.team.name}" class="team-logo-overlay" onerror="this.onerror=null; this.src='assets/img/team-placeholder.png'">`
                    : ''}
            </div>
            <div class="player-info">
                <h3>${player.name}</h3>
                <p>Idade: ${player.age || 'Não informada'}</p>
                <p>Nacionalidade: ${player.nationality || 'Não informada'}</p>
                <p>Time: ${player.team?.name || 'Não informado'}</p>
                <p>Competições: ${player.leagues?.join(', ') || 'Não informado'}</p>
                <button class="remove-btn" onclick="window.removeFromFavorites('players', '${player.id}')">Remover dos Favoritos</button>
            </div>
        </div>
    `;
}

function renderFavoriteTeamCard(team) {
    return `
        <div class="card team-card" data-id="${team.id}">
            <div class="team-header">
                <img src="${team.logo || 'assets/img/team-placeholder.png'}"
                     alt="${team.name}"
                     class="team-logo"
                     onerror="this.onerror=null; this.src='assets/img/team-placeholder.png'">
            </div>
            <div class="team-info">
                <h3>${team.name}</h3>
                <p class="team-location">${team.city !== 'Brasil' ? `${team.city}, ` : ''}${team.country || 'Brasil'}</p>
                <p class="team-leagues">Competições: ${team.leagues?.join(', ') || 'Não informado'}</p>
                <button class="remove-btn" onclick="window.removeFromFavorites('teams', '${team.id}')">Remover dos Favoritos</button>
            </div>
        </div>
    `;
}

// Função para carregar os dados do usuário logado no formulário de perfil
function loadUserProfile() {
    const loggedUser = getLoggedUser();
    if (loggedUser) {
        document.getElementById('profileUserId').value = loggedUser.id;
        document.getElementById('profileUsername').value = loggedUser.name;
        document.getElementById('profileEmail').value = loggedUser.email; // Email desabilitado, mas preenchido
        document.getElementById('profileCity').value = loggedUser.city || '';
        document.getElementById('profileCountry').value = loggedUser.country || '';
        document.getElementById('profileRole').value = loggedUser.role || 'Usuário Padrão';
    } else {
        // Se não houver usuário logado, redireciona para a página de login
        showModalMessage('Você precisa estar logado para acessar esta página.', () => {
            window.location.href = 'login.html';
        });
    }
}

// Função para carregar e exibir favoritos na página de perfil
function loadFavoritesOnProfile() {
    const favorites = getFavorites(); // Usa a função importada de auth.js
    
    const teamsContainer = document.getElementById('favoriteTeams');
    if (teamsContainer) {
        if (!favorites.teams || favorites.teams.length === 0) {
            teamsContainer.innerHTML = '<p class="no-favorites">Nenhum time favorito adicionado.</p>';
        } else {
            teamsContainer.innerHTML = favorites.teams.map(renderFavoriteTeamCard).join('');
        }
    }

    const playersContainer = document.getElementById('favoritePlayers');
    if (playersContainer) {
        if (!favorites.players || favorites.players.length === 0) {
            playersContainer.innerHTML = '<p class="no-favorites">Nenhum jogador favorito adicionado.</p>';
        } else {
            playersContainer.innerHTML = favorites.players.map(renderFavoritePlayerCard).join('');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile(); // Carrega os dados do usuário ao iniciar
    loadFavoritesOnProfile(); // Carrega e exibe os favoritos

    // Adiciona o listener para o formulário de perfil
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', (event) => {
            event.preventDefault();

            const loggedUser = getLoggedUser();
            if (!loggedUser) {
                showModalMessage('Erro: Nenhum usuário logado.');
                return;
            }

            const userId = document.getElementById('profileUserId').value;
            const username = document.getElementById('profileUsername').value;
            const newPassword = document.getElementById('profilePassword').value;
            const city = document.getElementById('profileCity').value;
            const country = document.getElementById('profileCountry').value;
            // O email e o papel não são editáveis pelo usuário no perfil, mas são mantidos no objeto
            const email = loggedUser.email;
            const role = loggedUser.role;

            // Lógica de senha para administradores no perfil (já implementada)
            let passwordToSave = loggedUser.password;
            if (newPassword) {
                if (role === 'Administrador' && newPassword !== '0000') {
                    showModalMessage('Como administrador, sua senha deve ser "0000". Não é possível alterar para outra senha.');
                    document.getElementById('profilePassword').value = '';
                    return;
                } else if (role === 'Administrador' && newPassword === '0000') {
                    passwordToSave = newPassword;
                } else {
                    passwordToSave = newPassword;
                }
            }

            const userData = {
                id: parseInt(userId),
                name: username,
                email: email,
                password: passwordToSave,
                city: city,
                country: country,
                role: role
            };

            // addOrUpdateUser atualiza os dados do usuário no localStorage
            addOrUpdateUser(userData); 
            
            // Atualiza a sessão para refletir as mudanças
            const updatedSession = {
                id: loggedUser.id,
                name: username,
                email: email,
                role: role,
                city: city,
                country: country
            };
            localStorage.setItem('session', JSON.stringify(updatedSession));

            showModalMessage('Dados do perfil salvos com sucesso!');
            loadUserProfile(); // Recarrega o perfil para refletir as mudanças
            document.getElementById('profilePassword').value = ''; // Limpa o campo de senha após a atualização
        });
    }

    // Listener para o botão de logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Ouve o evento de mudança de favoritos para atualizar o perfil em tempo real
    window.addEventListener(FAVORITES_CHANGED_EVENT, loadFavoritesOnProfile);
    window.addEventListener('storage', (e) => { // Para quando outra aba mudar favoritos
        if (e.key === FAVORITES_KEY) { // Usa a constante importada
            loadFavoritesOnProfile();
        }
    });
});

// Tornar removeFromFavorites globalmente acessível para os botões de remover nos cards
window.removeFromFavorites = removeFromFavorites; // Esta função é importada de auth.js