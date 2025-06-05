import { fetchFromAPI } from './api.js';

async function loadLeagueDetails(leagueId) {
    const leagueDetailsDiv = document.getElementById('leagueDetails');

    // Exibir uma mensagem de carregamento enquanto a requisição está em andamento
    if (leagueDetailsDiv) {
        leagueDetailsDiv.innerHTML = '<p>Carregando detalhes da liga...</p>';
    }

    try {
        // Fazendo a requisição para buscar os detalhes da liga
        // A função fetchFromAPI já contém a lógica de cache e limite de requisições.
        const data = await fetchFromAPI(`leagues?id=${leagueId}`);
        const league = data.response[0]; // Assume que o primeiro item da resposta é a liga

        if (!league) {
            if (leagueDetailsDiv) {
                leagueDetailsDiv.innerHTML = '<p>Detalhes da liga não encontrados.</p>';
            }
            return;
        }

        // Renderizando os detalhes da liga
        if (leagueDetailsDiv) {
            leagueDetailsDiv.innerHTML = `
                <div class="card">
                    <h2>${league.league.name}</h2>
                    <p>País: ${league.country.name}</p>
                    <p>Temporada Atual: ${league.seasons[league.seasons.length - 1].year}</p>
                    <p>Tipo: ${league.league.type}</p>
                    <img src="${league.league.logo}" alt="Logo da Liga" style="width: 100px; height: auto;">
                </div>
            `;
        }
    } catch (error) {
        console.error('Erro ao carregar detalhes da liga:', error);
        if (leagueDetailsDiv) {
            leagueDetailsDiv.innerHTML = '<p>Erro ao carregar detalhes da liga. Tente novamente mais tarde.</p>';
        }
    }
}

// Obtendo o ID da liga da URL
const urlParams = new URLSearchParams(window.location.search);
const leagueId = urlParams.get('id');

// Chamando a função para carregar os detalhes da liga
if (leagueId) {
    loadLeagueDetails(leagueId);
} else {
    const leagueDetailsDiv = document.getElementById('leagueDetails');
    if (leagueDetailsDiv) {
        leagueDetailsDiv.innerHTML = '<p>ID da liga não fornecido.</p>';
    }
}