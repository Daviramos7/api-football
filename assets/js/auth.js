// Função para salvar dados no localStorage
function saveToLocalStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

// Função para obter dados do localStorage
function getFromLocalStorage(key) {
    return JSON.parse(localStorage.getItem(key));
}

// Cadastro de usuário
document.getElementById('registerForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const users = getFromLocalStorage('users') || [];

    // Verifica se já existe usuário com o mesmo e-mail
    const alreadyExists = users.some(u => u.email === email);
    if (alreadyExists) {
        showModalMessage('Este e-mail já está cadastrado!');
        return;
    }

    const newUser = { name, email, password };
    users.push(newUser);
    saveToLocalStorage('users', users);
    saveToLocalStorage('session', newUser);

    showModalMessage('Cadastro realizado com sucesso!', () => {
        window.location.href = 'main.html';
    });
});


// Login de usuário
document.getElementById('loginForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const users = getFromLocalStorage('users') || [];
    const user = users.find((u) => u.email === email && u.password === password);

    if (user) {
    saveToLocalStorage('session', user);
    showModalMessage('Login realizado com sucesso!', () => {
        window.location.href = 'main.html';
    });
} else {
    showModalMessage('E-mail ou senha inválidos!');
}

});

function showModalMessage(message, callback) {
    const modal = document.getElementById('popupModal');
    const msg = document.getElementById('modalMessage');
    const closeBtn = document.getElementById('closeModal');

    msg.textContent = message;
    modal.showModal();

    const handler = () => {
        modal.close();
        closeBtn.removeEventListener('click', handler)
        if (callback) callback();
    };

    closeBtn.addEventListener('click', handler);
}