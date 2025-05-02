import { fetchFromAPI } from './api.js';

// Lista das ligas brasileiras
const BRAZILIAN_LEAGUES = [
    { id: 71, name: 'Brasileirão Série A' },
    { id: 72, name: 'Brasileirão Série B' },
    { id: 73, name: 'Brasileirão Série C' },
    { id: 74, name: 'Brasileirão Série D' }
];

// Temporada atual
const CURRENT_SEASON = '2025';

// Função para buscar jogadores e times por liga
async function searchBrazilianData(query) {
    const results = {
        players: new Map(), // Usamos Map para evitar duplicatas de jogadores
        teams: new Map()    // Usamos Map para evitar duplicatas de times
    };

    console.log('Buscando dados nas ligas brasileiras:', BRAZILIAN_LEAGUES);

    for (const league of BRAZILIAN_LEAGUES) {
        try {
            console.log(`Buscando jogadores e times na liga ${league.name} (ID: ${league.id})`);
            const data = await fetchFromAPI(`players?search=${query}&league=${league.id}&season=${CURRENT_SEASON}`);
            console.log(`Dados retornados para a liga ${league.name} (ID: ${league.id}):`, data.response);

            if (!data || !data.response || data.response.length === 0) {
                console.warn(`Nenhum jogador ou time encontrado para a liga ${league.name} (ID: ${league.id})`);
                continue;
            }

            // Processa os jogadores e times retornados
            data.response.forEach(playerData => {
                // Adiciona jogadores ao Map (evita duplicatas pelo ID do jogador)
                if (!results.players.has(playerData.player.id)) {
                    results.players.set(playerData.player.id, {
                        name: playerData.player.name,
                        age: playerData.player.age || 'Não informada',
                        nationality: playerData.player.nationality || 'Não informada',
                        photo: playerData.player.photo
                    });
                }

                // Adiciona times ao Map (evita duplicatas pelo ID do time)
                playerData.statistics.forEach(stat => {
                    if (stat.team && !results.teams.has(stat.team.id)) {
                        results.teams.set(stat.team.id, {
                            name: stat.team.name,
                            logo: stat.team.logo,
                            country: stat.team.country || 'Não informado'
                        });
                    }
                });
            });
        } catch (error) {
            console.error(`Erro ao buscar dados na liga ${league.name}:`, error);
        }
    }

    return results;
}

// Função para renderizar os resultados
async function renderSearchResults(query) {
    const resultsDiv = document.getElementById('searchResults');
    resultsDiv.innerHTML = '<p>Buscando...</p>';

    try {
        const { players, teams } = await searchBrazilianData(query);

        if (players.size === 0 && teams.size === 0) {
            resultsDiv.innerHTML = '<p>Nenhum jogador ou time encontrado nas ligas brasileiras.</p>';
            return;
        }

        let html = '';

        // Renderiza jogadores
        if (players.size > 0) {
            html += `
                <div class="search-section">
                    <h3>Jogadores</h3>
                    <div class="results-grid">
                        ${Array.from(players.values()).map(player => `
                            <div class="card">
                                <h3>${player.name}</h3>
                                <p>Idade: ${player.age}</p>
                                <p>Nacionalidade: ${player.nationality}</p>
                                <div class="player-photo-container">
                                    <img src="${player.photo}" alt="${player.name}" class="player-photo">
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Renderiza times
        if (teams.size > 0) {
            html += `
                <div class="search-section">
                    <h3>Times</h3>
                    <div class="results-grid">
                        ${Array.from(teams.values()).map(team => `
                            <div class="card">
                                <h3>${team.name}</h3>
                                <p>País: ${team.country}</p>
                                <div class="team-logo-container">
                                    <img src="${team.logo}" alt="${team.name}" class="team-logo">
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        resultsDiv.innerHTML = html;
    } catch (error) {
        console.error('Erro ao processar resultados:', error);
        resultsDiv.innerHTML = '<p>Erro ao processar os resultados. Tente novamente.</p>';
    }
}

// Configura o formulário de busca
document.getElementById('searchForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = document.getElementById('searchInput').value.trim();

    if (!query) {
        alert('Por favor, digite um termo para buscar');
        return;
    }

    await renderSearchResults(query);
});