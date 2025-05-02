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
    users.push({ name, email, password });
    saveToLocalStorage('users', users);

    alert('Cadastro realizado com sucesso!');
    window.location.href = 'index.html';
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
        alert('Login realizado com sucesso!');
        window.location.href = 'principal.html';
    } else {
        alert('E-mail ou senha inválidos!');
    }
});