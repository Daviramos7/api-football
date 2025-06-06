// assets/js/auth.js

const USERS_KEY = 'users';
const SESSION_KEY = 'session';

// --- Funções de Utilitários de LocalStorage ---
function saveToLocalStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function getFromLocalStorage(key) {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
}

// --- Funções de Gerenciamento de Usuários ---
export function getAllUsers() {
    return getFromLocalStorage(USERS_KEY) || [];
}

export function addOrUpdateUser(userData) {
    let users = getAllUsers();
    
    if (!userData.id) { // Criando um NOVO usuário
        userData.id = users.length > 0 ? Math.max(...users.map(u => u.id || 0)) + 1 : 1;
        // MUDANÇA IMPORTANTE: Adiciona um campo de favoritos para novos usuários
        userData.favorites = { teams: [], players: [] }; 
        console.log(`AUTH.JS: Criando novo usuário ID ${userData.id} com favoritos inicializados.`);
        users.push(userData);

    } else { // ATUALIZANDO um usuário existente
        const userIndex = users.findIndex(u => u.id === userData.id);
        if (userIndex > -1) {
            const currentUser = users[userIndex];
            console.log("AUTH.JS (addOrUpdateUser): Dados do usuário ANTES da atualização:", JSON.parse(JSON.stringify(currentUser)));
            console.log("AUTH.JS (addOrUpdateUser): Dados recebidos para ATUALIZAR:", JSON.parse(JSON.stringify(userData)));
            
            // Atualiza o usuário, garantindo que a senha e os favoritos existentes não sejam perdidos
            // se não forem explicitamente passados nos novos dados.
            users[userIndex] = { 
                ...currentUser, 
                ...userData,
                password: userData.password || currentUser.password,
                favorites: userData.favorites || currentUser.favorites
            };
            console.log("AUTH.JS (addOrUpdateUser): Dados do usuário DEPOIS da atualização:", JSON.parse(JSON.stringify(users[userIndex])));
        } else {
            // Caso raro: ID fornecido mas usuário não existe. Trata como novo.
            userData.favorites = { teams: [], players: [] };
            users.push(userData);
        }
    }
    
    saveToLocalStorage(USERS_KEY, users);
    return users.find(u => u.id === userData.id);
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

// Função para atualizar o próprio perfil do usuário logado
export function updateAuthUser(userData) {
    const loggedUser = getLoggedUser();
    if (!loggedUser || loggedUser.id !== userData.id) {
        return false;
    }
    
    if (addOrUpdateUser(userData)) {
        // Atualiza a sessão com os novos dados (exceto senha)
        const updatedUser = getUserById(userData.id);
        saveToLocalStorage(SESSION_KEY, {
            id: updatedUser.id, name: updatedUser.name, email: updatedUser.email, 
            role: updatedUser.role, city: updatedUser.city, country: updatedUser.country
        });
        return true;
    }
    return false;
}

// --- Funções de Autenticação (Listeners de Formulário, etc.) ---

document.getElementById('registerForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const userIdField = document.getElementById('userId');
    const userId = userIdField ? userIdField.value : null;
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const personalPasswordInput = document.getElementById('password');
    const personalPassword = personalPasswordInput.value;
    const city = document.getElementById('city')?.value || '';
    const country = document.getElementById('country')?.value || '';
    const role = document.getElementById('role')?.value || 'Usuário Padrão';
    
    let adminUniversalPassword = '';
    if (role === 'Administrador') {
        const adminPassInput = document.getElementById('adminUniversalPassword');
        if (adminPassInput) adminUniversalPassword = adminPassInput.value;
    }

    const users = getAllUsers();
    const alreadyExists = users.some(u => u.email === email && (!userId || u.id !== parseInt(userId)));
    if (alreadyExists) {
        showModalMessage('Este e-mail já está cadastrado para outro usuário!');
        return;
    }
    
    let passwordToSave;
    if (userId && !personalPassword) { // Em modo de edição, se a senha estiver em branco, mantém a antiga
        const existingUser = users.find(u => u.id === parseInt(userId));
        passwordToSave = existingUser.password;
    } else {
        passwordToSave = personalPassword;
    }
    
    // Validações de senha universal para administradores
    if (role === 'Administrador') {
        // Para um novo admin ou ao mudar para admin, a senha universal é necessária
        const isBecomingAdmin = !userId || users.find(u => u.id === parseInt(userId))?.role !== 'Administrador';
        if (isBecomingAdmin && adminUniversalPassword !== '0000') {
             showModalMessage('Para se registrar ou se tornar Administrador, a Senha Universal deve ser "0000".');
             return;
        }
    }

    const userData = { 
        id: userId ? parseInt(userId) : null, name, email, password: passwordToSave, city, country, role
    };
    console.log("AUTH.JS (registerForm listener): Enviando estes dados para addOrUpdateUser:", userData);

    const savedUser = addOrUpdateUser(userData);

    if (!userId) { // Novo Cadastro
        saveToLocalStorage(SESSION_KEY, { 
            id: savedUser.id, name: savedUser.name, email: savedUser.email, 
            role: savedUser.role, city: savedUser.city, country: savedUser.country
        });
        showModalMessage('Cadastro realizado com sucesso! Você será redirecionado.', () => {
            window.location.href = 'profile.html';
        });
    } else { // Edição bem-sucedida
        const loggedUser = getLoggedUser();
        // Atualiza a sessão apenas se o admin editou a si mesmo
        if (loggedUser && loggedUser.id === savedUser.id) {
            updateAuthUser(savedUser); // Reusa a função para garantir que a sessão fique correta
        }
        showModalMessage('Dados do usuário atualizados com sucesso!', () => {
            window.location.href = 'listing.html';
        });
    }
});

document.getElementById('loginForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const users = getAllUsers();
    const user = users.find((u) => u.email === email && u.password === password);
    if (user) {
        saveToLocalStorage(SESSION_KEY, { 
            id: user.id, name: user.name, email: user.email, 
            role: user.role, city: user.city, country: user.country
        });
        showModalMessage(`Login realizado com sucesso! Bem-vindo(a), ${user.name}!`, () => {
            window.location.href = 'main.html';
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
    showModalMessage('Você foi desconectado.', () => {
         window.location.href = 'login.html';
    });
}

export function showModalMessage(message, callback) {
    const modal = document.getElementById('popupModal');
    const msg = document.getElementById('modalMessage');
    const closeBtn = document.getElementById('closeModal');
    if (!modal || !msg || !closeBtn) {
        alert(message);
        if (callback) callback();
        return;
    }
    msg.textContent = message;
    const newCloseBtn = closeBtn.cloneNode(true);
    closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
    const handler = () => {
        if (modal.open) modal.close();
        if (callback) callback();
    };
    newCloseBtn.addEventListener('click', handler, { once: true });
    if (typeof modal.showModal === "function") {
        modal.showModal();
    } else {
        alert(message);
        if (callback) callback();
    }
}