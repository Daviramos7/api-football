// assets/js/listing.js
import { getAllUsers, deleteUser, getLoggedUser, showModalMessage } from './auth.js'; // Importa funções de auth.js

const dataTableBody = document.getElementById('data-table-body');
const searchInput = document.getElementById('search-input');
const noResultsMessage = document.getElementById('no-results');
const addNewBtn = document.getElementById('add-new-btn');
const tableHeaderActions = document.querySelector('#data-table thead th:last-child'); // Coluna "Ações"
const allActionButtons = document.querySelectorAll('.actions'); // Todas as células de "Ações"

// Função para renderizar uma linha da tabela de usuários
function renderTableRow(user) {
    // Verificamos o papel do usuário logado para mostrar ou esconder as ações
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
    // Adicione uma verificação adicional de admin antes de permitir a exclusão
    const loggedUser = getLoggedUser();
    if (!loggedUser || loggedUser.role !== 'Administrador') {
        showModalMessage('Você não tem permissão para excluir usuários.');
        return;
    }

    // Impede que um administrador exclua a si mesmo
    if (loggedUser.id === id) {
        showModalMessage('Um administrador não pode excluir a si mesmo.');
        return;
    }

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
    const loggedUser = getLoggedUser();

    // Redireciona se não houver usuário logado ou se não for administrador
    if (!loggedUser) {
        showModalMessage('Você precisa estar logado para acessar esta página.', () => {
            window.location.href = 'login.html';
        });
        return; // Sai da função para evitar o carregamento do restante
    }

    if (loggedUser.role !== 'Administrador') {
        showModalMessage('Você não tem permissão para acessar a listagem de usuários.', () => {
            window.location.href = 'main.html'; // Redireciona para a página principal
        });
        // Esconder elementos de admin para usuários normais
        addNewBtn.style.display = 'none';
        searchInput.style.display = 'none'; // Esconde o campo de busca também
        document.getElementById('filter-section').style.display = 'none'; // Esconde a seção inteira de filtro
        if (tableHeaderActions) {
            tableHeaderActions.style.display = 'none'; // Esconde o cabeçalho "Ações"
        }
        document.querySelectorAll('.actions').forEach(td => {
            td.style.display = 'none'; // Esconde as células "Ações"
        });

        // Limpa a tabela para não exibir nada
        dataTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Apenas administradores podem visualizar esta lista.</td></tr>';
        noResultsMessage.style.display = 'none'; // Garante que a mensagem "Nenhum usuário encontrado" não apareça
        
        return; // Sai da função para evitar o carregamento do restante
    }

    // Se for administrador, carrega os usuários
    filterAndSearchUsers(); // Exibe todos os usuários inicialmente
});