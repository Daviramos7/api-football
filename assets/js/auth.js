// assets/js/auth.js

// Chaves para localStorage
const USERS_KEY = 'users'; // Sua chave existente para usuários cadastrados
const SESSION_KEY = 'session';
const FAVORITES_KEY = 'footballFavorites'; // Do seu favorites.js
const FAVORITES_CHANGED_EVENT = 'favoritesChanged'; // Do seu favorites.js

// --- Funções de Utilitários de LocalStorage ---
function saveToLocalStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function getFromLocalStorage(key) {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
}

// --- Funções de Usuários (Centralizado aqui) ---

// Retorna todos os usuários
export function getAllUsers() {
    return getFromLocalStorage(USERS_KEY) || [];
}

// Adiciona um novo usuário ou atualiza um existente
export function addOrUpdateUser(userData) {
    let users = getAllUsers();
    
    // Gerar um ID único se for um novo usuário
    if (!userData.id) {
        userData.id = users.length > 0 ? Math.max(...users.map(u => u.id || 0)) + 1 : 1;
    }

    const existingUserIndex = users.findIndex(u => u.id === userData.id);

    if (existingUserIndex > -1) {
        // Atualiza usuário existente
        users[existingUserIndex] = { ...users[existingUserIndex], ...userData };
    } else {
        // Adiciona novo usuário
        users.push(userData);
    }
    saveToLocalStorage(USERS_KEY, users);
    return userData; // Retorna o usuário com o ID (novo ou existente)
}

// Deleta um usuário por ID
export function deleteUser(id) {
    let users = getAllUsers();
    users = users.filter(user => user.id !== id);
    saveToLocalStorage(USERS_KEY, users);
}

// Obtém um usuário por ID
export function getUserById(id) {
    const users = getAllUsers();
    return users.find(user => user.id === id);
}

// --- Funções de Autenticação ---

// Cadastro de usuário
document.getElementById('registerForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const userId = document.getElementById('userId')?.value; // Pode ser vazio para novo cadastro
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const city = document.getElementById('city')?.value || '';
    const country = document.getElementById('country')?.value || '';
    const role = document.getElementById('role')?.value || 'Usuário Padrão';

    const users = getAllUsers();

    // Verifica se já existe usuário com o mesmo e-mail (exceto para o próprio usuário em edição)
    const alreadyExists = users.some(u => u.email === email && (!userId || u.id !== parseInt(userId)));
    if (alreadyExists) {
        showModalMessage('Este e-mail já está cadastrado para outro usuário!');
        return;
    }

    const userData = { 
        id: userId ? parseInt(userId) : null, // ID será null para novos, ou o ID existente para edição
        name, email, password, city, country, role 
    };

    const savedUser = addOrUpdateUser(userData); // Usa a nova função de adição/atualização

    // Se for um novo cadastro, loga o usuário automaticamente
    if (!userId) {
        saveToLocalStorage(SESSION_KEY, { id: savedUser.id, name: savedUser.name, email: savedUser.email, role: savedUser.role });
        showModalMessage('Cadastro realizado com sucesso! Você será redirecionado.', () => {
            window.location.href = 'profile.html'; // Redireciona para o perfil após o cadastro
        });
    } else {
        // Se for edição, apenas informa e volta para a listagem
        showModalMessage('Dados do usuário atualizados com sucesso!', () => {
            window.location.href = 'listing.html'; // Volta para a listagem após edição
        });
    }
});

// Login de usuário
document.getElementById('loginForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const users = getAllUsers();
    const user = users.find((u) => u.email === email && u.password === password);

    if (user) {
        saveToLocalStorage(SESSION_KEY, { id: user.id, name: user.name, email: user.email, role: user.role });
        showModalMessage('Login realizado com sucesso! Você será redirecionado.', () => {
            window.location.href = 'profile.html'; // Redireciona para o perfil após login
        });
    } else {
        showModalMessage('E-mail ou senha inválidos!');
    }
});

// Função para obter o usuário logado
export function getLoggedUser() {
    return getFromLocalStorage(SESSION_KEY);
}

// Função para fazer logout
export function logout() {
    localStorage.removeItem(SESSION_KEY);
    alert('Você foi desconectado.');
    window.location.href = 'login.html'; // Redireciona para a página de login
}


// --- Funções de Favoritos (do seu favorites.js, exportadas aqui) ---
// Função para obter os favoritos do localStorage
export function getFavorites() {
    const saved = localStorage.getItem(FAVORITES_KEY);
    return saved ? JSON.parse(saved) : { teams: [], players: [] };
}

// Função para salvar os favoritos no localStorage
export function saveFavorites(favorites) {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    window.dispatchEvent(new CustomEvent(FAVORITES_CHANGED_EVENT, {
        detail: { favorites }
    }));
}

// Verifica se um item é favorito
export function isFavorite(type, item) {
    if (!item || !item.id) return false;
    const favorites = getFavorites();
    const id = Number(item.id); // Garante que o ID seja número
    return favorites[type]?.some(fav => Number(fav.id) === id);
}

// Adiciona/remover favorito
export function saveToFavorites(type, item) {
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
export function updateFavoriteButton(type, itemId, isFavored) {
    const buttons = document.querySelectorAll(
        `.favorite-btn[data-type="${type}"][data-id="${Number(itemId)}"]`
    );
    
    buttons.forEach(button => {
        button.classList.toggle('favored', isFavored);
        button.textContent = isFavored ? 'Remover Favorito' : 'Adicionar Favorito';
    });
}

// Sincroniza todos os botões com o estado do localStorage
export function syncFavoriteButtons() {
    const favorites = getFavorites();
    ['teams', 'players'].forEach(type => {
        document.querySelectorAll(`.favorite-btn[data-type="${type}"]`).forEach(button => {
            const id = Number(button.getAttribute('data-id'));
            const isFav = favorites[type]?.some(fav => Number(fav.id) === id);
            button.classList.toggle('favored', isFav);
            button.textContent = isFav ? 'Remover Favorito' : 'Adicionar Favorito';
        });
    });
}

// Remove favorito diretamente
export function removeFromFavorites(type, itemId) {
    const favorites = getFavorites();
    const id = Number(itemId);
    
    if (favorites[type]) {
        favorites[type] = favorites[type].filter(fav => Number(fav.id) === id ? false : true);
        saveFavorites(favorites);
        updateFavoriteButton(type, id, false);
        
        // Atualiza visualmente apenas se estiver na página de favoritos/perfil
        if (window.location.pathname.includes('profile.html') || window.location.pathname.includes('favorites.html')) {
            const cardToRemove = document.querySelector(`.card[data-id="${id}"]`);
            if (cardToRemove) {
                cardToRemove.remove();
                
                // Verifica se a seção ficou vazia
                const container = type === 'teams'
                    ? document.getElementById('favoriteTeams')
                    : document.getElementById('favoritePlayers');
                
                if (container && container.children.length === 0) {
                    container.innerHTML = `<p class="no-favorites">Nenhum ${type === 'teams' ? 'time' : 'jogador'} favorito adicionado.</p>`;
                }
            }
        }
    }
}


// --- Funções de Modal (do seu auth.js) ---
export function showModalMessage(message, callback) {
    const modal = document.getElementById('popupModal');
    const msg = document.getElementById('modalMessage');
    const closeBtn = document.getElementById('closeModal');

    msg.textContent = message;
    modal.showModal(); // Usa showModal() para um modal nativo <dialog>

    const handler = () => {
        modal.close();
        closeBtn.removeEventListener('click', handler); // Remove o listener para evitar múltiplos callbacks
        if (callback) callback();
    };

    // Certifica-se de que o listener não é adicionado múltiplas vezes
    closeBtn.removeEventListener('click', handler); // Remove antes de adicionar
    closeBtn.addEventListener('click', handler);
}

// --- Inicialização (para pages que precisam de favoritos) ---
document.addEventListener('DOMContentLoaded', () => {
    // Apenas sincroniza botões se existirem na página
    if (document.querySelectorAll('.favorite-btn').length > 0) {
        syncFavoriteButtons();
    }
    // Evento global para reagir a mudanças de favoritos (ex: outra aba)
    window.addEventListener('storage', (e) => {
        if (e.key === FAVORITES_KEY) {
            syncFavoriteButtons();
        }
    });
});

// Tornar funções globais para acesso direto no HTML (onclick)
window.saveToFavorites = saveToFavorites;
window.removeFromFavorites = removeFromFavorites;