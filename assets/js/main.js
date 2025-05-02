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

        // Agrupando jogos por liga
        const gamesByLeague = liveGames.reduce((acc, game) => {
            const leagueName = game.league.name;
            if (!acc[leagueName]) {
                acc[leagueName] = {
                    logo: game.league.logo,
                    games: [],
                };
            }
            acc[leagueName].games.push(game);
            return acc;
        }, {});

        // Renderizando os jogos ao vivo divididos por ligas
        liveGamesDiv.innerHTML = Object.keys(gamesByLeague).map(league => `
            <div class="league">
                <div class="league-header">
                    <img src="${gamesByLeague[league].logo}" alt="${league}" class="league-logo">
                    <h3>${league}</h3>
                </div>
                <div class="games">
                    ${gamesByLeague[league].games.map(game => `
                        <div class="game-card">
                            <div class="minute">${game.fixture.status.elapsed || 0}'</div>
                            <div class="logos">
                                <img src="${game.teams.home.logo}" alt="${game.teams.home.name}" class="team-logo">
                                <span class="score">${game.goals.home} - ${game.goals.away}</span>
                                <img src="${game.teams.away.logo}" alt="${game.teams.away.name}" class="team-logo">
                            </div>
                            <p class="teams">${game.teams.home.name} vs ${game.teams.away.name}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erro ao carregar jogos ao vivo:', error);
        document.getElementById('liveGames').innerHTML = '<p>Erro ao carregar jogos ao vivo. Tente novamente mais tarde.</p>';
    }
}

// Chamando a função para carregar os jogos ao vivo
loadLiveGames();