// Função para salvar favoritos no localStorage
function saveToFavorites(type, item) {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || {};
    if (!favorites[type]) {
        favorites[type] = [];
    }

    // Verifica se o item já está nos favoritos
    const exists = favorites[type].some(fav => fav.id === item.id);
    if (!exists) {
        favorites[type].push(item);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        alert(`${type} adicionado aos favoritos!`);
    } else {
        alert(`${type} já está nos favoritos.`);
    }
}

// Função para remover favoritos do localStorage
function removeFromFavorites(type, itemId) {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || {};
    if (favorites[type]) {
        favorites[type] = favorites[type].filter(fav => fav.id !== itemId);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        alert(`${type} removido dos favoritos!`);
    }
}

// Função para carregar e exibir favoritos
function loadFavorites() {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || {};
    const favoritesDiv = document.getElementById('favorites');

    if (!favoritesDiv) return;

    if (Object.keys(favorites).length === 0) {
        favoritesDiv.innerHTML = '<p>Você ainda não tem favoritos.</p>';
        return;
    }

    favoritesDiv.innerHTML = Object.keys(favorites).map(type => `
        <div>
            <h3>${type.charAt(0).toUpperCase() + type.slice(1)}</h3>
            ${favorites[type].map(item => `
                <div class="card">
                    <p>${item.name}</p>
                    <button onclick="removeFromFavorites('${type}', ${item.id})">Remover</button>
                </div>
            `).join('')}
        </div>
    `).join('');
}

// Exibe os favoritos ao carregar a página
document.addEventListener('DOMContentLoaded', loadFavorites);

// Exportando funções para uso em outros arquivos
export { saveToFavorites, removeFromFavorites };