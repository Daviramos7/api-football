import { getAllUsers, deleteUser, getLoggedUser, showModalMessage } from './auth.js';
const dataTableBody = document.getElementById('data-table-body');
const searchInput = document.getElementById('search-input');
const noResultsMessage = document.getElementById('no-results');
const addNewBtn = document.getElementById('add-new-btn');
const tableHeaderActions = document.querySelector('#data-table thead th:last-child');
const allActionButtons = document.querySelectorAll('.actions');

function renderTableRow(user) {
    const loggedUser = getLoggedUser();
    const showActions = loggedUser && loggedUser.role === 'Administrador';

    return `
        <tr data-id="${user.id}">
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.city || 'N/A'}</td>
            <td>${user.country || 'N/A'}</td>
            <td>${user.role || 'Usuário Padrão'}</td>
            <td class="actions" style="display: ${showActions ? '' : 'none'};">
                <button class="btn btn-edit" onclick="handleEditUser(${user.id})">Editar</button>
                <button class="btn btn-delete" onclick="handleDeleteUser(${user.id})">Excluir</button>
            </td>
        </tr>
    `;
}

function displayUsers(users) {
    dataTableBody.innerHTML = '';
    if (users.length === 0) {
        noResultsMessage.style.display = 'block';
    } else {
        noResultsMessage.style.display = 'none';
        users.forEach(user => {
            dataTableBody.innerHTML += renderTableRow(user);
        });
    }
}

function filterAndSearchUsers() {
    const searchText = searchInput.value.toLowerCase();
    let users = getAllUsers(); 

    let filtered = users.filter(user => {
        return user.name.toLowerCase().includes(searchText) ||
               user.email.toLowerCase().includes(searchText) ||
               (user.city && user.city.toLowerCase().includes(searchText)) ||
               (user.country && user.country.toLowerCase().includes(searchText));
    });

    displayUsers(filtered);
}

window.handleEditUser = (id) => {
    window.location.href = `registre.html?id=${id}`; 
};

window.handleDeleteUser = (id) => {
 const loggedUser = getLoggedUser();
    if (!loggedUser || loggedUser.role !== 'Administrador') {
        showModalMessage('Você não tem permissão para excluir usuários.');
        return;
    }

    if (loggedUser.id === id) {
        showModalMessage('Um administrador não pode excluir a si mesmo.');
        return;
    }

    if (confirm('Tem certeza que deseja excluir este usuário?')) {
        deleteUser(id); 
        filterAndSearchUsers(); 
        alert('Usuário excluído com sucesso!');
    }
};

addNewBtn.addEventListener('click', () => {
    window.location.href = 'registre.html'; 
});

searchInput.addEventListener('input', filterAndSearchUsers);

document.addEventListener('DOMContentLoaded', () => {
    const loggedUser = getLoggedUser();

    if (!loggedUser) {
        showModalMessage('Você precisa estar logado para acessar esta página.', () => {
            window.location.href = 'index.html';
        });
        return;
    }

    if (loggedUser.role !== 'Administrador') {
        showModalMessage('Você não tem permissão para acessar a listagem de usuários.', () => {
            window.location.href = 'main.html'; 
        });
        
        return; 
    }

    filterAndSearchUsers();
});