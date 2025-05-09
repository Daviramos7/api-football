// Chave para armazenar os favoritos no localStorage
const FAVORITES_KEY = 'footballFavorites';

// Evento personalizado para sincronização entre abas/páginas
const FAVORITES_CHANGED_EVENT = 'favoritesChanged';

// Função para obter os favoritos do localStorage
function getFavorites() {
    const favoritesString = localStorage.getItem(FAVORITES_KEY);
    return favoritesString ? JSON.parse(favoritesString) : { teams: [], players: [], leagues: [] };
}

// Função para salvar os favoritos no localStorage
function saveFavorites(favorites) {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    
    // Dispara evento personalizado para notificar outras partes da mesma página
    window.dispatchEvent(new CustomEvent(FAVORITES_CHANGED_EVENT, { 
        detail: { favorites: favorites }
    }));
}

// Função para verificar se um item já está nos favoritos
function isFavorite(type, item) {
    if (!item || !item.id) return false;
    
    const favorites = getFavorites();
    return favorites[type] && favorites[type].some(fav => fav.id === item.id);
}

// Função para salvar favoritos no localStorage
function saveToFavorites(type, item) {
    try {
        // Se item for string (caso de onclick inline), tenta converter para objeto
        let itemData = item;
        if (typeof item === 'string') {
            try {
                itemData = JSON.parse(item);
            } catch (e) {
                console.error('Erro ao parsear item:', e);
                return;
            }
        }
        
        if (!itemData || !itemData.id) {
            console.error('Item inválido:', itemData);
            return;
        }

        const favorites = getFavorites();

        if (!favorites[type]) {
            favorites[type] = [];
        }

        // Verifica se já está nos favoritos
        if (!isFavorite(type, itemData)) {
            favorites[type].push(itemData);
            saveFavorites(favorites);
            updateFavoriteButton(type, itemData.id, true); // Atualiza a cor da estrela
            alert(`${type === 'teams' ? 'Time' : type === 'players' ? 'Jogador' : 'Item'} adicionado aos favoritos!`);
        } else {
            // Se já estiver nos favoritos, remove
            removeFromFavorites(type, itemData.id);
        }
    } catch (error) {
        console.error('Erro ao salvar favorito:', error);
        alert('Erro ao salvar favorito. Verifique o console para mais detalhes.');
    }
}

// Função para remover favoritos do localStorage
function removeFromFavorites(type, itemId) {
    const favorites = getFavorites();

    if (favorites[type]) {
        favorites[type] = favorites[type].filter(fav => fav.id !== itemId);
        saveFavorites(favorites);
        
        // Atualiza explicitamente o estado do botão
        updateFavoriteButton(type, itemId, false);
        
        // Se estiver na página de favoritos, remove o elemento visualmente
        if (window.location.pathname.includes('favorites.html')) {
            const cardToRemove = document.querySelector(`#favorite-${type}-${itemId}`);
            if (cardToRemove) {
                cardToRemove.remove();
                
                // Verifica se a seção ficou vazia
                const container = document.getElementById(`favorite${type.charAt(0).toUpperCase() + type.slice(1)}`);
                if (container && container.querySelector('.favorite-card') === null) {
                    container.innerHTML = '<p class="no-favorites">Nenhum item favorito.</p>';
                }
            }
        } else {
            alert(`${type === 'teams' ? 'Time' : type === 'players' ? 'Jogador' : 'Item'} removido dos favoritos!`);
        }
    }
}

// Renderiza card de time
function renderFavoriteTeamCard(team) {
    return `
        <div class="favorite-card team-card" id="favorite-teams-${team.id}">
            <div class="team-header">
                <img src="${team.logo}" alt="${team.name}" class="team-logo" onerror="this.src='assets/img/team-placeholder.png'">
            </div>
            <div class="team-info">
                <h3>${team.name}</h3>
                <p class="team-location">${team.city !== 'Brasil' ? `${team.city}, ` : ''}${team.country}</p>
                ${team.leagues && team.leagues.length ? `<p class="team-leagues">Competições: ${team.leagues.join(', ')}</p>` : ''}
                ${team.founded ? `<p>Fundado em: ${team.founded}</p>` : ''}
                <button class="remove-btn" onclick="window.removeFromFavorites('teams', '${team.id}')">Remover dos Favoritos</button>
            </div>
        </div>
    `;
}

// Renderiza card de jogador
function renderFavoritePlayerCard(player) {
    return `
        <div class="favorite-card player-card" id="favorite-players-${player.id}">
            <div class="player-photo-container">
                <img src="${player.photo}" alt="${player.name}" class="player-photo" onerror="this.src='assets/img/player-placeholder.png'">
                ${player.team?.logo ?
                    `<img src="${player.team.logo}" alt="${player.team.name}" class="team-logo-overlay" onerror="this.src='assets/img/team-placeholder.png'">` 
                    : ''}
            </div>
            <div class="player-info">
                <h3>${player.name}</h3>
                <p>Idade: ${player.age || 'Não informada'}</p>
                <p>Nacionalidade: ${player.nationality || 'Não informada'}</p>
                <p>Time: ${player.team?.name || 'Não informado'}</p>
                ${player.leagues && player.leagues.length ? `<p>Competições: ${player.leagues.join(', ')}</p>` : ''}
                <button class="remove-btn" onclick="window.removeFromFavorites('players', '${player.id}')">Remover dos Favoritos</button>
            </div>
        </div>
    `;
}

// Renderiza card de liga
function renderFavoriteLeagueCard(league) {
    return `
        <div class="favorite-card league-card" id="favorite-leagues-${league.id}">
            <div class="league-header">
                <img src="${league.logo}" alt="${league.name}" class="league-logo" onerror="this.src='assets/img/league-placeholder.png'">
            </div>
            <div class="league-info">
                <h3>${league.name}</h3>
                <p>País: ${league.country}</p>
                ${league.season ? `<p>Temporada: ${league.season}</p>` : ''}
                <button class="remove-btn" onclick="window.removeFromFavorites('leagues', '${league.id}')">Remover dos Favoritos</button>
            </div>
        </div>
    `;
}

// Função para carregar e exibir favoritos na página favorites.html
function loadFavorites() {
    const favorites = getFavorites();
    
    // Carregar times favoritos
    const favoriteTeamsContainer = document.getElementById('favoriteTeams');
    if (favoriteTeamsContainer) {
        if (!favorites.teams || favorites.teams.length === 0) {
            favoriteTeamsContainer.innerHTML = '<p class="no-favorites">Nenhum time favorito.</p>';
        } else {
            favoriteTeamsContainer.innerHTML = favorites.teams.map(team => renderFavoriteTeamCard(team)).join('');
        }
    }
    
    // Carregar jogadores favoritos
    const favoritePlayersContainer = document.getElementById('favoritePlayers');
    if (favoritePlayersContainer) {
        if (!favorites.players || favorites.players.length === 0) {
            favoritePlayersContainer.innerHTML = '<p class="no-favorites">Nenhum jogador favorito.</p>';
        } else {
            favoritePlayersContainer.innerHTML = favorites.players.map(player => renderFavoritePlayerCard(player)).join('');
        }
    }
    
    // Carregar ligas favoritas (se existirem)
    const favoriteLeaguesContainer = document.getElementById('favoriteLeagues');
    if (favoriteLeaguesContainer) {
        if (!favorites.leagues || favorites.leagues.length === 0) {
            favoriteLeaguesContainer.innerHTML = '<p class="no-favorites">Nenhuma liga favorita.</p>';
        } else {
            favoriteLeaguesContainer.innerHTML = favorites.leagues.map(league => renderFavoriteLeagueCard(league)).join('');
        }
    }
}

// Função para atualizar visualmente o botão de favorito
function updateFavoriteButton(type, itemId, isFavored) {
    try {
        // Seleciona todos os botões correspondentes a esse item
        const buttons = document.querySelectorAll(`.favorite-btn[data-type="${type}"][data-id="${itemId}"]`);
        
        buttons.forEach(button => {
            if (isFavored) {
                button.classList.add('favored');
            } else {
                button.classList.remove('favored');
            }
        });
        
        console.log(`Botões atualizados para ${type}:${itemId} - isFavored: ${isFavored}, botões encontrados: ${buttons.length}`);
    } catch (error) {
        console.error('Erro ao atualizar botão de favorito:', error);
    }
}

// Função para sincronizar estado visual dos botões com localStorage
function syncFavoriteButtons() {
    const favorites = getFavorites();
    
    // Para cada tipo de favorito
    ['teams', 'players', 'leagues'].forEach(type => {
        // Primeiro, remova o estado 'favored' de todos os botões deste tipo
        document.querySelectorAll(`.favorite-btn[data-type="${type}"]`).forEach(button => {
            button.classList.remove('favored');
        });
        
        // Depois, adicione o estado apenas aos que estão realmente nos favoritos
        if (favorites[type]) {
            favorites[type].forEach(item => {
                if (item && item.id) {
                    updateFavoriteButton(type, item.id, true);
                }
            });
        }
    });
    
    console.log('Sincronização de botões concluída');
}

// Adiciona ouvinte para alterações no localStorage de outras abas/páginas
window.addEventListener('storage', (event) => {
    if (event.key === FAVORITES_KEY) {
        console.log('Evento storage detectado - atualizando UI');
        
        // Sincroniza os botões com o novo estado
        syncFavoriteButtons();
        
        // Se estiver na página de favoritos, recarrega os favoritos
        if (window.location.pathname.includes('favorites.html')) {
            loadFavorites();
        }
    }
});

// Adiciona ouvinte para o evento personalizado dentro da mesma página
window.addEventListener(FAVORITES_CHANGED_EVENT, (event) => {
    console.log('Evento interno FAVORITES_CHANGED_EVENT detectado - atualizando UI');
    syncFavoriteButtons();
});

// Adiciona funções globais para uso no HTML
window.removeFromFavorites = function(type, itemId) {
    console.log(`Removendo dos favoritos: ${type}:${itemId}`);
    removeFromFavorites(type, itemId);
};

// Exibe os favoritos ao carregar a página e sincroniza os botões
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado - inicializando estado dos favoritos');
    
    // Sincroniza os botões de favoritos com o localStorage
    syncFavoriteButtons();
    
    // Se estiver na página de favoritos, carrega os favoritos
    if (window.location.pathname.includes('favorites.html')) {
        loadFavorites();
    }
});

// Exportando funções para uso em outros arquivos
export { 
    saveToFavorites, 
    removeFromFavorites, 
    isFavorite, 
    updateFavoriteButton,
    syncFavoriteButtons,
    FAVORITES_CHANGED_EVENT
};