import { fetchFromAPI } from './api.js';

async function loadMatchDetails(matchId) {
    try {
        // Fazendo a requisição para buscar os detalhes da partida
        const data = await fetchFromAPI(`fixtures?id=${matchId}`);
        const match = data.response[0];

        const matchDetailsDiv = document.getElementById('matchDetails');

        if (!match) {
            matchDetailsDiv.innerHTML = '<p>Detalhes da partida não encontrados.</p>';
            return;
        }

        // Renderizando os detalhes da partida
        matchDetailsDiv.innerHTML = `
            <div class="card">
                <h2>${match.teams.home.name} vs ${match.teams.away.name}</h2>
                <p>Status: ${match.fixture.status.long}</p>
                <p>Placar: ${match.goals.home} - ${match.goals.away}</p>
                <p>Data: ${new Date(match.fixture.date).toLocaleDateString()}</p>
                <p>Horário: ${new Date(match.fixture.date).toLocaleTimeString()}</p>
                <p>Estádio: ${match.fixture.venue.name}, ${match.fixture.venue.city}</p>
            </div>
        `;
    } catch (error) {
        console.error('Erro ao carregar detalhes da partida:', error);
        document.getElementById('matchDetails').innerHTML = '<p>Erro ao carregar detalhes da partida. Tente novamente mais tarde.</p>';
    }
}

// Obtendo o ID da partida da URL
const urlParams = new URLSearchParams(window.location.search);
const matchId = urlParams.get('id');

// Chamando a função para carregar os detalhes da partida
if (matchId) {
    loadMatchDetails(matchId);
} else {
    document.getElementById('matchDetails').innerHTML = '<p>ID da partida não fornecido.</p>';
}