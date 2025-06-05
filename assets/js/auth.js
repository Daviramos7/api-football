// assets/js/auth.js

// Chaves para localStorage
const USERS_KEY = 'users';
const SESSION_KEY = 'session';
// FAVORITES_KEY e FAVORITES_CHANGED_EVENT movidos para favorites.js

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
        // Preserva a senha se não for fornecida uma nova na atualização
        const currentUser = users[existingUserIndex];
        users[existingUserIndex] = { 
            ...currentUser, 
            ...userData,
            password: userData.password || currentUser.password // Mantém senha antiga se a nova for vazia/null
        };
    } else {
        users.push(userData);
    }
    saveToLocalStorage(USERS_KEY, users);
    return users.find(u => u.id === userData.id); // Retorna o usuário salvo/atualizado
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

export function updateAuthUser(userData) { // Usado para atualizar o próprio perfil logado
    let users = getAllUsers();
    const loggedUser = getLoggedUser();

    if (!loggedUser || loggedUser.id !== userData.id) {
        console.error('Erro: Tentativa de atualizar um usuário que não está logado ou ID incorreto.');
        return false;
    }

    const userIndex = users.findIndex(u => u.id === userData.id);

    if (userIndex > -1) {
        users[userIndex] = { 
            ...users[userIndex], 
            ...userData,
            password: userData.password || users[userIndex].password // Mantém senha antiga se a nova for vazia
        };
        saveToLocalStorage(USERS_KEY, users);

        // Atualiza a sessão com os novos dados (exceto senha)
        saveToLocalStorage(SESSION_KEY, {
            id: users[userIndex].id,
            name: users[userIndex].name,
            email: users[userIndex].email,
            role: users[userIndex].role,
            city: users[userIndex].city, // Adicionado de volta, se presente
            country: users[userIndex].country // Adicionado de volta, se presente
        });
        return true;
    }
    return false;
}


// --- Funções de Autenticação ---

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
    
    let passwordToSave = personalPassword;

    if (userId) { // Modo Edição
        const existingUser = users.find(u => u.id === parseInt(userId));
        if (personalPassword) {
            passwordToSave = personalPassword;
        } else {
            passwordToSave = existingUser.password; // Mantém a senha antiga se o campo estiver vazio
        }
        // Validação da senha universal do admin SÓ se o papel for admin E uma nova senha universal for digitada OU se for um novo admin
         if (role === 'Administrador' && document.getElementById('adminUniversalPasswordGroup').style.display === 'block' && adminUniversalPassword !== '0000') {
            showModalMessage('Para definir como Administrador, a Senha Universal do Administrador deve ser "0000".');
            return;
        }
    } else { // Modo Cadastro Novo
        if (!personalPassword) {
            showModalMessage('Por favor, digite uma senha pessoal.');
            return;
        }
        if (role === 'Administrador') {
            if (adminUniversalPassword !== '0000') {
                showModalMessage('Para se registrar como Administrador, a Senha Universal do Administrador deve ser "0000".');
                return;
            }
        } else if (adminUniversalPassword) {
             showModalMessage('A Senha Universal do Administrador só é relevante para o papel de Administrador.');
             return;
        }
    }


    const userData = { 
        id: userId ? parseInt(userId) : null,
        name,
        email,
        password: passwordToSave, 
        city,
        country,
        role
    };

    const savedUser = addOrUpdateUser(userData);

    if (!userId) { 
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
    } else { 
        // Se o admin editou outro usuário, apenas atualiza. Se editou a si mesmo, atualiza a sessão.
        const loggedUser = getLoggedUser();
        if (loggedUser && loggedUser.id === savedUser.id) {
            saveToLocalStorage(SESSION_KEY, {
                 id: savedUser.id, 
                 name: savedUser.name, 
                 email: savedUser.email, 
                 role: savedUser.role,
                 city: savedUser.city,
                 country: savedUser.country
            });
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
            id: user.id, 
            name: user.name, 
            email: user.email, 
            role: user.role,
            city: user.city,
            country: user.country
        });
        showModalMessage(`Login realizado com sucesso! Bem-vindo(a), ${user.name}! Você será redirecionado.`, () => {
            window.location.href = 'main.html'; // Redireciona para main.html após login
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
    // Não limpa os favoritos ao deslogar
    showModalMessage('Você foi desconectado.', () => {
         window.location.href = 'login.html';
    });
}

export function showModalMessage(message, callback) {
    const modal = document.getElementById('popupModal');
    const msg = document.getElementById('modalMessage');
    const closeBtn = document.getElementById('closeModal');

    if (!modal || !msg || !closeBtn) {
        console.warn('Elementos do modal não encontrados. Exibindo alert padrão.');
        alert(message);
        if (callback) callback();
        return;
    }

    msg.textContent = message;
    
    // Garante que o listener antigo seja removido antes de adicionar um novo
    const newCloseBtn = closeBtn.cloneNode(true);
    closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);

    const handler = () => {
        modal.close();
        if (callback) callback();
    };

    newCloseBtn.addEventListener('click', handler, { once: true }); // { once: true } para auto-remover após clique
    
    if (typeof modal.showModal === "function") {
        modal.showModal();
    } else {
        console.warn("Browser não suporta dialog.showModal(). Exibindo alert.");
        alert(message);
        if (callback) callback();
    }
}