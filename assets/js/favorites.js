// assets/js/favorites.js

export const FAVORITES_KEY = 'footballFavorites';
export const FAVORITES_CHANGED_EVENT = 'favoritesChanged';

export function getFavorites() {
    const saved = localStorage.getItem(FAVORITES_KEY);
    const favorites = saved ? JSON.parse(saved) : { teams: [], players: [] };
    // console.log('DEBUG: favorites.js (getFavorites) - Favoritos carregados:', JSON.parse(JSON.stringify(favorites))); // Log verboso, descomente se necessário
    return favorites;
}

export function saveFavoritesStorage(favorites) {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    console.log('DEBUG: favorites.js (saveFavoritesStorage) - Favoritos salvos no localStorage:', JSON.parse(JSON.stringify(favorites)));
    window.dispatchEvent(new CustomEvent(FAVORITES_CHANGED_EVENT, {
        detail: { favorites }
    }));
}

export function isFavorite(type, item) {
    if (!item || typeof item.id === 'undefined') {
        console.warn('DEBUG: favorites.js (isFavorite) - Item ou item.id inválido:', item);
        return false;
    }
    const favorites = getFavorites();
    const id = Number(item.id);
    // console.log(`DEBUG: favorites.js (isFavorite) - Checando tipo: ${type}, ID: ${id}`); // Log verboso
    return favorites[type]?.some(fav => Number(fav.id) === id);
}

export function updateFavoriteButtonClass(type, itemId, isFavored) {
    const buttons = document.querySelectorAll(
        `.favorite-btn[data-type="${type}"][data-id="${Number(itemId)}"]`
    );
    // console.log(`DEBUG: favorites.js (updateFavoriteButtonClass) - Atualizando ${buttons.length} botões para tipo: ${type}, ID: ${itemId}, Favorecido: ${isFavored}`); // Log verboso
    buttons.forEach(button => {
        button.classList.toggle('favored', isFavored);
    });
}

export function toggleFavorite(type, itemData) {
    console.log(`DEBUG: favorites.js (toggleFavorite) - Chamado para tipo: ${type}, itemData recebido:`, JSON.parse(JSON.stringify(itemData)));
    try {
        let currentItemData = itemData;
        if (typeof itemData === 'string') {
            try {
                currentItemData = JSON.parse(itemData);
                console.log(`DEBUG: favorites.js (toggleFavorite) - itemData (após parse string):`, JSON.parse(JSON.stringify(currentItemData)));
            } catch (e) {
                console.error("DEBUG: favorites.js (toggleFavorite) - Erro ao fazer parse do JSON em itemData:", itemData, e);
                alert('Ocorreu um erro ao processar o favorito (parse JSON).');
                return;
            }
        }

        if (!currentItemData || typeof currentItemData.id === 'undefined') {
            console.error('DEBUG: favorites.js (toggleFavorite) - Dados do item inválidos para favoritar (ID ausente ou item nulo):', currentItemData);
            alert('Não foi possível adicionar/remover favorito: dados inválidos.');
            return;
        }

        const id = Number(currentItemData.id);
        const itemName = currentItemData.name || 'Item desconhecido'; // Para logs e alertas
        console.log(`DEBUG: favorites.js (toggleFavorite) - Processando item: "${itemName}", ID original: ${currentItemData.id}, ID convertido: ${id}`);

        if (isNaN(id)) {
            console.error(`DEBUG: favorites.js (toggleFavorite) - ID inválido (NaN) para item: "${itemName}" após conversão. ID original: ${currentItemData.id}`);
            alert(`Erro: ID inválido para ${type === 'teams' ? 'time' : 'jogador'} "${itemName}".`);
            return;
        }

        const favorites = getFavorites();

        if (!favorites[type]) {
            favorites[type] = [];
        }

        const index = favorites[type].findIndex(fav => Number(fav.id) === id);

        if (index === -1) { // Não é favorito, adicionar
            const simplifiedData = {
                id, // Usa o ID convertido e validado
                name: currentItemData.name,
                photo: currentItemData.photo || (type === 'players' ? 'assets/img/player-placeholder.png' : null),
                logo: currentItemData.logo || (type === 'teams' ? 'assets/img/team-placeholder.png' : null),
                age: currentItemData.age || 'Não informada',
                nationality: currentItemData.nationality === 'Brazil' ? 'Brasil' : currentItemData.nationality || 'Não informada',
                team: type === 'players' ? { 
                    id: currentItemData.team?.id, // Adicionar ID do time do jogador se disponível
                    name: currentItemData.team?.name || 'Não informado', 
                    logo: currentItemData.team?.logo || 'assets/img/team-placeholder.png' 
                } : null,
                leagues: currentItemData.leagues || ['Não informado'],
                city: type === 'teams' ? (currentItemData.city || 'Brasil') : null,
                country: type === 'teams' ? (currentItemData.country === 'Brazil' ? 'Brasil' : currentItemData.country || 'Brasil') : null,
                founded: type === 'teams' ? currentItemData.founded : null,
                venue: type === 'teams' ? currentItemData.venue : null
            };
            console.log(`DEBUG: favorites.js (toggleFavorite) - Adicionando "${simplifiedData.name}" (ID: ${id}) aos favoritos.`);
            favorites[type].push(simplifiedData);
            alert(`${type === 'teams' ? 'Time' : 'Jogador'} "${simplifiedData.name}" adicionado aos favoritos!`);
            updateFavoriteButtonClass(type, id, true);
        } else { // Já é favorito, remover
            console.log(`DEBUG: favorites.js (toggleFavorite) - Removendo "${itemName}" (ID: ${id}) dos favoritos.`);
            favorites[type].splice(index, 1);
            alert(`${type === 'teams' ? 'Time' : 'Jogador'} "${itemName}" removido dos favoritos.`);
            updateFavoriteButtonClass(type, id, false);
        }

        saveFavoritesStorage(favorites);
    } catch (error) {
        console.error('DEBUG: favorites.js (toggleFavorite) - Erro:', error);
        alert('Ocorreu um erro ao atualizar os favoritos.');
    }
}

export function syncFavoriteButtons() {
    // console.log('DEBUG: favorites.js (syncFavoriteButtons) - Sincronizando botões...'); // Log verboso
    const favorites = getFavorites();
    ['teams', 'players'].forEach(type => {
        document.querySelectorAll(`.favorite-btn[data-type="${type}"]`).forEach(button => {
            const id = Number(button.getAttribute('data-id'));
            if (isNaN(id)) return; 
            const isFav = favorites[type]?.some(fav => Number(fav.id) === id);
            button.classList.toggle('favored', isFav);
        });
    });
}

export function removeFromFavoritesOnPage(type, itemId, pageContext = null) {
    console.log(`DEBUG: favorites.js (removeFromFavoritesOnPage) - Removendo tipo: ${type}, ID: ${itemId}, Contexto: ${pageContext}`);
    const favorites = getFavorites();
    const id = Number(itemId);
    
    if (favorites[type]) {
        const itemToRemove = favorites[type].find(fav => Number(fav.id) === id);
        const itemName = itemToRemove?.name || 'Item';
        
        favorites[type] = favorites[type].filter(fav => Number(fav.id) !== id);
        saveFavoritesStorage(favorites);
        updateFavoriteButtonClass(type, id, false); 
        alert(`${type === 'teams' ? 'Time' : 'Jogador'} "${itemName}" removido dos favoritos.`);
        
        if (pageContext === 'favoritesPage' || pageContext === 'profilePage') {
            // ... (lógica de remoção do DOM como antes) ...
            const cardToRemove = document.querySelector(
                `.card[data-id="${id}"][data-type="${type}"], .favorite-card[data-id="${id}"][data-type="${type}"]`
            ) || document.querySelector(`.card[data-id="${id}"], .favorite-card[data-id="${id}"]`);

            if (cardToRemove) {
                cardToRemove.remove();
                let containerId = type === 'teams' ? 'favoriteTeams' : 'favoritePlayers';
                const container = document.getElementById(containerId);
                if (container && container.children.length === 0) {
                    container.innerHTML = `<p class="no-favorites">Nenhum ${type === 'teams' ? 'time' : 'jogador'} favorito adicionado.</p>`;
                }
            }
        }
    }
}