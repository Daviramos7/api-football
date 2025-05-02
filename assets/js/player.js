import { fetchFromAPI } from './api.js';

async function loadPlayerDetails(playerId) {
    try {
        // Fazendo a requisição para buscar os detalhes do jogador
        const data = await fetchFromAPI(`players?id=${playerId}`);
        const player = data.response[0];

        const playerDetailsDiv = document.getElementById('playerDetails');

        if (!player) {
            playerDetailsDiv.innerHTML = '<p>Detalhes do jogador não encontrados.</p>';
            return;
        }

        // Renderizando os detalhes do jogador
        playerDetailsDiv.innerHTML = `
            <div class="card">
                <h2>${player.player.name}</h2>
                <p>Idade: ${player.player.age}</p>
                <p>Nacionalidade: ${player.player.nationality}</p>
                <p>Altura: ${player.player.height || 'Não disponível'}</p>
                <p>Peso: ${player.player.weight || 'Não disponível'}</p>
                <img src="${player.player.photo}" alt="Foto do Jogador" style="width: 100px; height: auto;">
            </div>
        `;
    } catch (error) {
        console.error('Erro ao carregar detalhes do jogador:', error);
        document.getElementById('playerDetails').innerHTML = '<p>Erro ao carregar detalhes do jogador. Tente novamente mais tarde.</p>';
    }
}

// Obtendo o ID do jogador da URL
const urlParams = new URLSearchParams(window.location.search);
const playerId = urlParams.get('id');

// Chamando a função para carregar os detalhes do jogador
if (playerId) {
    loadPlayerDetails(playerId);
} else {
    document.getElementById('playerDetails').innerHTML = '<p>ID do jogador não fornecido.</p>';
}