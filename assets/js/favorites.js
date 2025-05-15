// Chave para armazenar os favoritos no localStorage
const FAVORITES_KEY = 'footballFavorites';
const FAVORITES_CHANGED_EVENT = 'favoritesChanged';

// Função para obter os favoritos do localStorage
function getFavorites() {
    const saved = localStorage.getItem(FAVORITES_KEY);
    return saved ? JSON.parse(saved) : { teams: [], players: [] };
}

// Função para salvar os favoritos no localStorage
function saveFavorites(favorites) {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    window.dispatchEvent(new CustomEvent(FAVORITES_CHANGED_EVENT, {
        detail: { favorites }
    }));
}

// Verifica se um item é favorito
function isFavorite(type, item) {
    if (!item || !item.id) return false;
    const favorites = getFavorites();
    const id = Number(item.id); // Garante que o ID seja número
    return favorites[type]?.some(fav => Number(fav.id) === id);
}

// Adiciona/remover favorito
function saveToFavorites(type, item) {
    try {
        let itemData = item;
        if (typeof item === 'string') {
            itemData = JSON.parse(item);
        }

        const id = Number(itemData.id); // Garante que o ID seja número
        const favorites = getFavorites();

        if (!favorites[type]) {
            favorites[type] = [];
        }

        const index = favorites[type].findIndex(fav => Number(fav.id) === id);

        if (index === -1) {
            // Adicionar
            const simplifiedData = {
                id,
                name: itemData.name,
                photo: itemData.photo || 'assets/img/player-placeholder.png',
                age: itemData.age || 'Não informada',
                nationality: itemData.nationality === 'Brazil' ? 'Brasil' : itemData.nationality || 'Não informada',
                team: {
                    name: itemData.team?.name || 'Não informado',
                    logo: itemData.team?.logo || 'assets/img/team-placeholder.png'
                },
                leagues: itemData.leagues || ['Não informado'],
                logo: itemData.logo || 'assets/img/team-placeholder.png',
                city: itemData.city || 'Brasil',
                country: itemData.country === 'Brazil' ? 'Brasil' : itemData.country || 'Brasil'
            };
            
            favorites[type].push(simplifiedData);
            alert(`${type === 'teams' ? 'Time' : 'Jogador'} adicionado aos favoritos!`);
        } else {
            // Remover
            favorites[type].splice(index, 1);
            alert(`${type === 'teams' ? 'Time' : 'Jogador'} removido dos favoritos.`);
        }

        saveFavorites(favorites);
        updateFavoriteButton(type, id, index === -1);
    } catch (error) {
        console.error('Erro ao salvar favorito:', error);
    }
}

// Atualiza visualmente o botão de favorito
function updateFavoriteButton(type, itemId, isFavored) {
    const buttons = document.querySelectorAll(
        `.favorite-btn[data-type="${type}"][data-id="${Number(itemId)}"]`
    );
    
    buttons.forEach(button => {
        button.classList.toggle('favored', isFavored);
    });
}

// Sincroniza todos os botões com o estado do localStorage
function syncFavoriteButtons() {
    const favorites = getFavorites();
    ['teams', 'players'].forEach(type => {
        document.querySelectorAll(`.favorite-btn[data-type="${type}"]`).forEach(button => {
            const id = Number(button.getAttribute('data-id'));
            const isFav = favorites[type]?.some(fav => Number(fav.id) === id);
            button.classList.toggle('favored', isFav);
        });
    });
}

// Renderiza cartão de jogador nos favoritos
function renderFavoritePlayerCard(player) {
    return `
        <div class="card player-card">
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

// Renderiza cartão de time nos favoritos
function renderFavoriteTeamCard(team) {
    return `
        <div class="card team-card">
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

// Carrega favoritos na página favorites.html
function loadFavorites() {
    const favorites = getFavorites();
    
    // Times
    const teamsContainer = document.getElementById('favoriteTeams');
    if (teamsContainer) {
        if (!favorites.teams || favorites.teams.length === 0) {
            teamsContainer.innerHTML = '<p class="no-favorites">Nenhum time favorito.</p>';
        } else {
            teamsContainer.innerHTML = favorites.teams.map(renderFavoriteTeamCard).join('');
        }
    }

    // Jogadores
    const playersContainer = document.getElementById('favoritePlayers');
    if (playersContainer) {
        if (!favorites.players || favorites.players.length === 0) {
            playersContainer.innerHTML = '<p class="no-favorites">Nenhum jogador favorito.</p>';
        } else {
            playersContainer.innerHTML = favorites.players.map(renderFavoritePlayerCard).join('');
        }
    }
}

// Remove favorito diretamente
function removeFromFavorites(type, itemId) {
    const favorites = getFavorites();
    const id = Number(itemId);
    
    if (favorites[type]) {
        favorites[type] = favorites[type].filter(fav => Number(fav.id) === id ? false : true);
        saveFavorites(favorites);
        updateFavoriteButton(type, id, false);
        
        // Atualiza visualmente apenas se estiver na página de favoritos
        if (window.location.pathname.includes('favorites.html')) {
            const cardToRemove = document.querySelector(`.card[data-id="${id}"]`);
            if (cardToRemove) {
                cardToRemove.remove();
                
                // Verifica se a seção ficou vazia
                const container = type === 'teams' 
                    ? document.getElementById('favoriteTeams') 
                    : document.getElementById('favoritePlayers');
                
                if (container && container.children.length === 0) {
                    container.innerHTML = '<p class="no-favorites">Nenhum item favorito.</p>';
                }
            }
        }
    }
}

// Exportando funções
// favorites.js
export { 
    saveToFavorites, 
    removeFromFavorites, 
    isFavorite, 
    updateFavoriteButton,
    syncFavoriteButtons,
    FAVORITES_CHANGED_EVENT,
    getFavorites 
};

// Eventos globais
window.addEventListener('storage', (e) => {
    if (e.key === FAVORITES_KEY) {
        syncFavoriteButtons();
        if (window.location.pathname.includes('favorites.html')) {
            loadFavorites();
        }
    }
});

window.addEventListener(FAVORITES_CHANGED_EVENT, () => {
    syncFavoriteButtons();
    if (window.location.pathname.includes('favorites.html')) {
        loadFavorites();
    }
});

// Disponibilizando globalmente
window.saveToFavorites = saveToFavorites;
window.removeFromFavorites = removeFromFavorites;

// Inicializa ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    syncFavoriteButtons();
    if (window.location.pathname.includes('favorites.html')) {
        loadFavorites();
    }
});

const links = document.querySelectorAll('nav ul li a');
const currentPage = window.location.pathname.split('/').pop();

links.forEach(link => {
  const linkHref = link.getAttribute('href');

  if (linkHref === currentPage) {
    link.classList.add('active');
  }
});