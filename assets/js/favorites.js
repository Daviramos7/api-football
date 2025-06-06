// assets/js/favorites.js
import { getLoggedUser, addOrUpdateUser, getAllUsers } from './auth.js';

// Este evento continua útil para atualizar a UI em tempo real
export const FAVORITES_CHANGED_EVENT = 'favoritesChanged';

// A chave 'footballFavorites' não é mais usada para salvar, mas é bom tê-la para o evento de storage
// se você quiser que abas diferentes reajam a qualquer mudança de favoritos.
export const FAVORITES_KEY_FOR_EVENT = 'userFavoritesUpdated';


/**
 * Pega os favoritos DO USUÁRIO LOGADO.
 * @returns {{teams: Array, players: Array}} Objeto de favoritos do usuário ou um objeto vazio.
 */
export function getFavorites() {
    const loggedUser = getLoggedUser();
    if (!loggedUser) {
        return { teams: [], players: [] }; // Nenhum usuário logado, retorna favoritos vazios.
    }

    const users = getAllUsers();
    const currentUser = users.find(user => user.id === loggedUser.id);
    
    // Retorna os favoritos do usuário ou um objeto vazio se a propriedade não existir (por segurança).
    return currentUser?.favorites || { teams: [], players: [] };
}

/**
 * Salva o objeto de favoritos para o usuário logado.
 * @param {object} favorites - O objeto de favoritos atualizado ({ teams: [...], players: [...] }).
 */
function saveCurrentUserFavorites(favorites) {
    const loggedUser = getLoggedUser();
    if (!loggedUser) {
        console.error("Não é possível salvar favoritos: nenhum usuário logado.");
        return;
    }

    // Cria um objeto de dados para atualização, contendo apenas o ID e os favoritos.
    const userDataToUpdate = {
        id: loggedUser.id,
        favorites: favorites
    };

    // Reutiliza a função de auth.js para encontrar o usuário e atualizar seus dados.
    addOrUpdateUser(userDataToUpdate);
    
    // Dispara o evento para notificar outras partes da UI sobre a mudança.
    window.dispatchEvent(new CustomEvent(FAVORITES_CHANGED_EVENT, {
        detail: { newFavorites: favorites } // Envia os novos favoritos no evento
    }));
}

/**
 * Verifica se um item é favorito para o usuário logado.
 * @param {'teams'|'players'} type - O tipo de item.
 * @param {object} item - O objeto do time ou jogador, deve conter um 'id'.
 * @returns {boolean} - True se for favorito, false caso contrário.
 */
export function isFavorite(type, item) {
    const loggedUser = getLoggedUser();
    if (!loggedUser || !item || typeof item.id === 'undefined') {
        return false;
    }

    const favorites = getFavorites(); // Automaticamente pega os favoritos do usuário logado.
    const id = Number(item.id);
    return favorites[type]?.some(fav => Number(fav.id) === id);
}

/**
 * Adiciona ou remove um item dos favoritos do usuário logado.
 * @param {'teams'|'players'} type - O tipo de item.
 * @param {object|string} itemData - Os dados do item a ser favoritado.
 */
export function toggleFavorite(type, itemData) {
    const loggedUser = getLoggedUser();
    if (!loggedUser) {
        alert("Você precisa estar logado para adicionar ou remover favoritos.");
        return;
    }

    try {
        let currentItemData = itemData;
        if (typeof itemData === 'string') {
            try { currentItemData = JSON.parse(itemData); } 
            catch (e) { console.error("Erro ao fazer parse do JSON:", e); return; }
        }

        if (!currentItemData || typeof currentItemData.id === 'undefined') {
            alert('Não foi possível favoritar: dados inválidos.'); return;
        }

        const id = Number(currentItemData.id);
        const itemName = currentItemData.name || 'Item';
        if (isNaN(id)) { alert(`Erro: ID inválido para "${itemName}".`); return; }

        const favorites = getFavorites(); // Pega os favoritos DO USUÁRIO ATUAL

        if (!favorites[type]) {
            favorites[type] = [];
        }

        const index = favorites[type].findIndex(fav => Number(fav.id) === id);

        if (index === -1) { // Adicionar
            const simplifiedData = {
                id, name: currentItemData.name,
                photo: currentItemData.photo || (type === 'players' ? 'assets/img/player-placeholder.png' : null),
                logo: currentItemData.logo || (type === 'teams' ? 'assets/img/team-placeholder.png' : null),
                age: currentItemData.age || 'Não informada',
                nationality: currentItemData.nationality || 'Não informada',
                team: type === 'players' ? { id: currentItemData.team?.id, name: currentItemData.team?.name || 'Não informado', logo: currentItemData.team?.logo || 'assets/img/team-placeholder.png' } : null,
                leagues: currentItemData.leagues || ['Não informado'],
                city: type === 'teams' ? (currentItemData.city || 'Brasil') : null,
                country: type === 'teams' ? (currentItemData.country || 'Brasil') : null
            };
            favorites[type].push(simplifiedData);
            alert(`${type === 'teams' ? 'Time' : 'Jogador'} "${simplifiedData.name}" adicionado aos favoritos!`);
            updateFavoriteButtonClass(type, id, true);
        } else { // Remover
            favorites[type].splice(index, 1);
            alert(`${type === 'teams' ? 'Time' : 'Jogador'} "${itemName}" removido dos favoritos.`);
            updateFavoriteButtonClass(type, id, false);
        }

        saveCurrentUserFavorites(favorites); // Salva os favoritos NO PERFIL DO USUÁRIO
    } catch (error) {
        console.error('Erro em toggleFavorite:', error);
        alert('Ocorreu um erro ao atualizar os favoritos.');
    }
}

/**
 * Remove um item dos favoritos e atualiza a UI da página (usado em profile.html e favorites.html).
 */
export function removeFromFavoritesOnPage(type, itemId, pageContext = null) {
    const loggedUser = getLoggedUser();
    if (!loggedUser) return;

    const id = Number(itemId);
    const favorites = getFavorites();
    const itemToRemove = favorites[type]?.find(fav => Number(fav.id) === id);
    
    if (itemToRemove) {
        const itemName = itemToRemove.name || 'Item';
        favorites[type] = favorites[type].filter(fav => Number(fav.id) !== id);
        
        saveCurrentUserFavorites(favorites);
        alert(`${type === 'teams' ? 'Time' : 'Jogador'} "${itemName}" removido dos favoritos.`);
        
        if (pageContext === 'favoritesPage' || pageContext === 'profilePage') {
            const cardToRemove = document.querySelector(`.card[data-id="${id}"][data-type="${type}"]`);
            if (cardToRemove) {
                cardToRemove.remove();
                const container = document.getElementById(type === 'teams' ? 'favoriteTeams' : 'favoritePlayers');
                if (container && container.children.length === 0) {
                    container.innerHTML = `<p class="no-favorites">Nenhum ${type === 'teams' ? 'time' : 'jogador'} favorito adicionado.</p>`;
                }
            }
        }
    }
}

// Funções de sincronização de botões permanecem, mas agora usam getFavorites() que é sensível ao usuário.
export function syncFavoriteButtons() {
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

export function updateFavoriteButtonClass(type, itemId, isFavored) {
    const buttons = document.querySelectorAll(
        `.favorite-btn[data-type="${type}"][data-id="${Number(itemId)}"]`
    );
    buttons.forEach(button => {
        button.classList.toggle('favored', isFavored);
    });
}