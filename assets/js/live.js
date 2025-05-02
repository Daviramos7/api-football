import { fetchFromAPI } from './api.js';

async function loadLiveGames() {
    try {
        // Fazendo a requisição para buscar jogos ao vivo
        const data = await fetchFromAPI('fixtures?live=all');
        const liveGames = data.response;

        const liveGamesDiv = document.getElementById('liveGames');

        if (liveGames.length === 0) {
            liveGamesDiv.innerHTML = '<p>Não há jogos ao vivo no momento.</p>';
            return;
        }

        // Renderizando os jogos ao vivo
        liveGamesDiv.innerHTML = liveGames.map((game) => `
            <div class="card">
                <h3>${game.teams.home.name} vs ${game.teams.away.name}</h3>
                <p>Status: ${game.fixture.status.long}</p>
                <p>Placar: ${game.goals.home} - ${game.goals.away}</p>
                <p>Horário: ${new Date(game.fixture.date).toLocaleTimeString()}</p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erro ao carregar jogos ao vivo:', error);
        document.getElementById('liveGames').innerHTML = '<p>Erro ao carregar jogos ao vivo. Tente novamente mais tarde.</p>';
    }
}

// Chamando a função para carregar os jogos ao vivo
loadLiveGames();