// assets/js/auth.js

// Chaves para localStorage
const USERS_KEY = 'users';
const SESSION_KEY = 'session';
const FAVORITES_KEY = 'footballFavorites';
const FAVORITES_CHANGED_EVENT = 'favoritesChanged';

// --- Funções de Utilitários de LocalStorage ---
function saveToLocalStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function getFromLocalStorage(key) {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
}

// --- Funções de Usuários ---

export function getAllUsers() {
    return getFromLocalStorage(USERS_KEY) || [];
}

export function addOrUpdateUser(userData) {
    let users = getAllUsers();
    
    if (!userData.id) {
        userData.id = users.length > 0 ? Math.max(...users.map(u => u.id || 0)) + 1 : 1;
    }

    const existingUserIndex = users.findIndex(u => u.id === userData.id);

    if (existingUserIndex > -1) {
        users[existingUserIndex] = { ...users[existingUserIndex], ...userData };
    } else {
        users.push(userData);
    }
    saveToLocalStorage(USERS_KEY, users);
    return userData;
}

export function deleteUser(id) {
    let users = getAllUsers();
    users = users.filter(user => user.id !== id);
    saveToLocalStorage(USERS_KEY, users);
}

export function getUserById(id) {
    const users = getAllUsers();
    return users.find(user => user.id === id);
}

export function updateAuthUser(userData) {
    let users = getAllUsers();
    const loggedUser = getLoggedUser();

    if (!loggedUser || loggedUser.id !== userData.id) {
        console.error('Erro: Tentativa de atualizar um usuário que não está logado ou ID incorreto.');
        return false;
    }

    const userIndex = users.findIndex(u => u.id === userData.id);

    if (userIndex > -1) {
        users[userIndex] = { ...users[userIndex], ...userData };
        saveToLocalStorage(USERS_KEY, users);

        saveToLocalStorage(SESSION_KEY, {
            id: users[userIndex].id,
            name: users[userIndex].name,
            email: users[userIndex].email,
            role: users[userIndex].role,
            city: users[userIndex].city,
            country: users[userIndex].country
        });
        return true;
    }
    return false;
}

// --- Funções de Autenticação ---

document.getElementById('registerForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const userId = document.getElementById('userId')?.value;
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const personalPassword = document.getElementById('password').value; // Senha pessoal
    const city = document.getElementById('city')?.value || '';
    const country = document.getElementById('country')?.value || '';
    const role = document.getElementById('role')?.value || 'Usuário Padrão';
    
    // Captura a senha universal do administrador, se o papel for Administrador
    let adminUniversalPassword = '';
    if (role === 'Administrador') {
        adminUniversalPassword = document.getElementById('adminUniversalPassword').value;
    }

    const users = getAllUsers();

    const alreadyExists = users.some(u => u.email === email && (!userId || u.id !== parseInt(userId)));
    if (alreadyExists) {
        showModalMessage('Este e-mail já está cadastrado para outro usuário!');
        return;
    }

    // --- Lógica de Validação de Senhas ---
    // 1. Validação da senha pessoal
    if (!personalPassword && !userId) { // Apenas para novos cadastros, a senha pessoal é obrigatória
        showModalMessage('Por favor, digite uma senha pessoal.');
        return;
    }

    // 2. Validação da senha universal do administrador, se aplicável
    if (role === 'Administrador') {
        if (adminUniversalPassword !== '0000') {
            showModalMessage('Para se registrar como Administrador, a Senha Universal do Administrador deve ser "0000".');
            return;
        }
        // Se a senha universal está correta, a senha armazenada para o admin será a senha pessoal
        // No login, ele só precisará da senha pessoal (ou seja, a senha universal é apenas para registro)
    } else {
        // Se não for administrador, garante que a senha universal não foi preenchida erroneamente
        if (adminUniversalPassword) {
            showModalMessage('A Senha Universal do Administrador deve ser preenchida apenas para usuários com papel de Administrador.');
            return;
        }
    }
    // --- Fim da Lógica de Validação de Senhas ---

    const userData = { 
        id: userId ? parseInt(userId) : null,
        name,
        email,
        password: personalPassword, // A senha armazenada será sempre a senha pessoal
        city,
        country,
        role
    };

    const savedUser = addOrUpdateUser(userData);

    if (!userId) { // Novo cadastro
        saveToLocalStorage(SESSION_KEY, { 
            id: savedUser.id, 
            name: savedUser.name, 
            email: savedUser.email, 
            role: savedUser.role,
            city: savedUser.city,
            country: savedUser.country
        });
        showModalMessage('Cadastro realizado com sucesso! Você será redirecionado.', () => {
            window.location.href = 'profile.html';
        });
    } else { // Edição de usuário
        showModalMessage('Dados do usuário atualizados com sucesso!', () => {
            window.location.href = 'listing.html';
        });
    }
});

document.getElementById('loginForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value; // No login, continua usando a senha pessoal

    const users = getAllUsers();
    // Apenas a senha pessoal é usada para login
    const user = users.find((u) => u.email === email && u.password === password);

    if (user) {
        saveToLocalStorage(SESSION_KEY, { 
            id: user.id, 
            name: user.name, 
            email: user.email, 
            role: user.role,
            city: user.city,
            country: user.country
        });
        showModalMessage(`Login realizado com sucesso! Bem-vindo(a), ${user.role}! Você será redirecionado.`, () => {
            window.location.href = 'profile.html';
        });
    } else {
        showModalMessage('E-mail ou senha inválidos!');
    }
});

export function getLoggedUser() {
    return getFromLocalStorage(SESSION_KEY);
}

export function logout() {
    localStorage.removeItem(SESSION_KEY);
    alert('Você foi desconectado.');
    window.location.href = 'login.html';
}

// --- Funções de Favoritos (sem alterações, mantidas para o contexto completo) ---
export function getFavorites() {
    const saved = localStorage.getItem(FAVORITES_KEY);
    return saved ? JSON.parse(saved) : { teams: [], players: [] };
}

export function saveFavorites(favorites) {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    window.dispatchEvent(new CustomEvent(FAVORITES_CHANGED_EVENT, {
        detail: { favorites }
    }));
}

export function isFavorite(type, item) {
    if (!item || !item.id) return false;
    const favorites = getFavorites();
    const id = Number(item.id);
    return favorites[type]?.some(fav => Number(fav.id) === id);
}

export function saveToFavorites(type, item) {
    try {
        let itemData = item;
        if (typeof item === 'string') {
            itemData = JSON.parse(item);
        }

        const id = Number(itemData.id);
        const favorites = getFavorites();

        if (!favorites[type]) {
            favorites[type] = [];
        }

        const index = favorites[type].findIndex(fav => Number(fav.id) === id);

        if (index === -1) {
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
            favorites[type].splice(index, 1);
            alert(`${type === 'teams' ? 'Time' : 'Jogador'} removido dos favoritos.`);
        }

        saveFavorites(favorites);
        updateFavoriteButton(type, id, index === -1);
    } catch (error) {
        console.error('Erro ao salvar favorito:', error);
    }
}

export function updateFavoriteButton(type, itemId, isFavored) {
    const buttons = document.querySelectorAll(
        `.favorite-btn[data-type="${type}"][data-id="${Number(itemId)}"]`
    );
    
    buttons.forEach(button => {
        button.classList.toggle('favored', isFavored);
        button.textContent = isFavored ? 'Remover Favorito' : 'Adicionar Favorito';
    });
}

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

export function removeFromFavorites(type, itemId) {
    const favorites = getFavorites();
    const id = Number(itemId);
    
    if (favorites[type]) {
        favorites[type] = favorites[type].filter(fav => Number(fav.id) === id ? false : true);
        saveFavorites(favorites);
        updateFavoriteButton(type, id, false);
        
        if (window.location.pathname.includes('profile.html') || window.location.pathname.includes('favorites.html')) {
            const cardToRemove = document.querySelector(`.card[data-id="${id}"]`);
            if (cardToRemove) {
                cardToRemove.remove();
                
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

export function showModalMessage(message, callback) {
    const modal = document.getElementById('popupModal');
    const msg = document.getElementById('modalMessage');
    const closeBtn = document.getElementById('closeModal');

    msg.textContent = message;
    modal.showModal();

    const handler = () => {
        modal.close();
        closeBtn.removeEventListener('click', handler);
        if (callback) callback();
    };

    closeBtn.removeEventListener('click', handler);
    closeBtn.addEventListener('click', handler);
}

window.saveToFavorites = saveToFavorites;
window.removeFromFavorites = removeFromFavorites;