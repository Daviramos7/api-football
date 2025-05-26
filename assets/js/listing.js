// assets/js/listing.js
import { getAllUsers, deleteUser } from './auth.js'; // Importa funções de auth.js

const dataTableBody = document.getElementById('data-table-body');
const searchInput = document.getElementById('search-input');
const noResultsMessage = document.getElementById('no-results');
const addNewBtn = document.getElementById('add-new-btn');

// Função para renderizar uma linha da tabela de usuários
function renderTableRow(user) {
    return `
        <tr data-id="${user.id}">
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.city || 'N/A'}</td>
            <td>${user.country || 'N/A'}</td>
            <td>${user.role || 'N/A'}</td>
            <td class="actions">
                <button class="btn btn-edit" onclick="handleEditUser(${user.id})">Editar</button>
                <button class="btn btn-delete" onclick="handleDeleteUser(${user.id})">Excluir</button>
            </td>
        </tr>
    `;
}

// Função para exibir os usuários na tabela
function displayUsers(users) {
    dataTableBody.innerHTML = ''; // Limpa a tabela
    if (users.length === 0) {
        noResultsMessage.style.display = 'block';
    } else {
        noResultsMessage.style.display = 'none';
        users.forEach(user => {
            dataTableBody.innerHTML += renderTableRow(user);
        });
    }
}

// Função para filtrar e buscar usuários
function filterAndSearchUsers() {
    const searchText = searchInput.value.toLowerCase();
    let users = getAllUsers(); // Pega os usuários do auth.js

    let filtered = users.filter(user => {
        return user.name.toLowerCase().includes(searchText) ||
               user.email.toLowerCase().includes(searchText) ||
               (user.city && user.city.toLowerCase().includes(searchText)) ||
               (user.country && user.country.toLowerCase().includes(searchText));
    });

    displayUsers(filtered);
}

// Função para lidar com a edição de usuário (redireciona para a página de cadastro/edição)
window.handleEditUser = (id) => {
    window.location.href = `registre.html?id=${id}`; // Passa o ID do usuário como parâmetro na URL
};

// Função para lidar com a exclusão de usuário
window.handleDeleteUser = (id) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
        deleteUser(id); // Usa a função de auth.js
        filterAndSearchUsers(); // Atualiza a tabela após exclusão
        alert('Usuário excluído com sucesso!');
    }
};

// Listener para o botão "Adicionar Novo Usuário"
addNewBtn.addEventListener('click', () => {
    window.location.href = 'registre.html'; // Redireciona para a página de cadastro
});

// Event listeners para busca
searchInput.addEventListener('input', filterAndSearchUsers);

// Inicializa a exibição dos dados ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    filterAndSearchUsers(); // Exibe todos os usuários inicialmente
});