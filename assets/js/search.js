import { fetchFromAPI } from './api.js';

// Adicione esta função auxiliar no início do arquivo, logo após o import
function removeAccents(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Adicione esta função auxiliar para formatar o país
function formatCountry(country) {
    return country === 'Brazil' ? 'Brasil' : country;
}

// Ligas principais do Brasil com IDs de ambas as versões
const BRAZILIAN_LEAGUES = [
    { 
        id: { v3: 71, v2: 7079 }, 
        name: 'Brasileirão Série A',
        season: 2025,
        startDate: '2025-03-29',
        endDate: '2025-12-21'
    },
    { 
        id: { v3: 72, v2: 7093 }, 
        name: 'Brasileirão Série B',
        season: 2025,
        startDate: '2025-04-04',
        endDate: '2025-11-22'
    },
    { 
        id: { v3: 75, v2: 7124 }, 
        name: 'Brasileirão Série C',
        season: 2025,
        startDate: '2025-04-12',
        endDate: '2025-08-31'
    },
    { 
        id: { v3: 76, v2: 7123 }, 
        name: 'Brasileirão Série D',
        season: 2025,
        startDate: '2025-04-12',
        endDate: '2025-07-19'
    },
    { 
        id: { v3: 73, v2: 7069 }, 
        name: 'Copa do Brasil',
        season: 2025,
        startDate: '2025-02-18',
        endDate: '2025-05-20'
    }
];

// Função para buscar jogadores e times por liga
async function searchBrazilianData(query) {
    const results = {
        players: new Map(),
        teams: new Map()
    };

    // Normaliza o termo de busca removendo acentos
    const normalizedQuery = removeAccents(query.toLowerCase());
    console.log('Iniciando busca nas ligas brasileiras com termo:', normalizedQuery);

    for (const league of BRAZILIAN_LEAGUES) {
        try {
            console.log(`Buscando times na liga ${league.name}`);
            
            let teamsData = await fetchFromAPI(`teams?league=${league.id.v3}&season=${league.season}`, 'v3');
            
            if (teamsData?.response) {
                teamsData.response.forEach(teamData => {
                    const team = teamData.team;
                    const teamId = team.id.toString();
                    
                    // Compara usando a versão normalizada do nome do time
                    const normalizedTeamName = removeAccents(team.name.toLowerCase());
                    if (normalizedTeamName.includes(normalizedQuery)) {
                        if (results.teams.has(teamId)) {
                            const existingTeam = results.teams.get(teamId);
                            if (!existingTeam.leagues.includes(league.name)) {
                                existingTeam.leagues.push(league.name);
                                results.teams.set(teamId, existingTeam);
                            }
                        } else {
                            results.teams.set(teamId, {
                                id: team.id,
                                name: team.name,
                                logo: team.logo,
                                leagues: [league.name],
                                venue: team.venue || null,
                                founded: team.founded || null,
                                country: formatCountry(team.country),
                                city: team.city || 'Brasil'
                            });
                        }
                    }
                });
            }

            // Busca na v2 se necessário
            if ((!teamsData?.response || teamsData.response.length === 0) && league.id.v2) {
                teamsData = await fetchFromAPI(`teams/league/${league.id.v2}`, 'v2');
                
                if (teamsData?.api?.teams) {
                    teamsData.api.teams.forEach(team => {
                        const teamId = team.team_id.toString();
                        
                        // Compara usando a versão normalizada do nome do time
                        const normalizedTeamName = removeAccents(team.name.toLowerCase());
                        if (normalizedTeamName.includes(normalizedQuery)) {
                            if (results.teams.has(teamId)) {
                                const existingTeam = results.teams.get(teamId);
                                if (!existingTeam.leagues.includes(league.name)) {
                                    existingTeam.leagues.push(league.name);
                                    results.teams.set(teamId, existingTeam);
                                }
                            } else {
                                results.teams.set(teamId, {
                                    id: team.team_id,
                                    name: team.name,
                                    logo: team.logo,
                                    leagues: [league.name],
                                    venue: null,
                                    founded: team.founded,
                                    country: formatCountry(team.country),
                                    city: team.city || 'Brasil'
                                });
                            }
                        }
                    });
                }
            }

            // Busca de jogadores
            let playersData = await fetchFromAPI(
                `players?search=${encodeURIComponent(removeAccents(query))}&league=${league.id.v3}&season=${league.season}`,
                'v3'
            );

            if (playersData?.response) {
                playersData.response.forEach(playerData => {
                    const player = playerData.player;
                    const playerId = player.id.toString();
                    
                    // Compara usando a versão normalizada do nome do jogador
                    const normalizedPlayerName = removeAccents(player.name.toLowerCase());
                    if (normalizedPlayerName.includes(normalizedQuery)) {
                        if (!results.players.has(playerId)) {
                            // Pegamos as informações do time das estatísticas
                            const teamInfo = playerData.statistics?.[0]?.team || {
                                name: 'Time não informado',
                                logo: 'caminho/para/imagem/padrao.png'
                            };

                            results.players.set(playerId, {
                                id: playerId,
                                name: player.name,
                                photo: player.photo,
                                age: player.age,
                                nationality: player.nationality,
                                leagues: [league.name],
                                team: {
                                    name: teamInfo.name,
                                    logo: teamInfo.logo
                                },
                                stats: {}
                            });
                        }
                        
                        // Adiciona estatísticas da liga atual
                        const currentStats = playerData.statistics?.[0];
                        if (currentStats) {
                            results.players.get(playerId).stats[league.name] = {
                                games: currentStats.games?.appearances || 0,
                                goals: currentStats.goals?.total || 0,
                                assists: currentStats.goals?.assists || 0
                            };
                        }
                    }
                });
            }

        } catch (error) {
            console.error(`Erro ao buscar dados na liga ${league.name}:`, error);
        }
    }

    // Ordena os times por nome antes de retornar
    const sortedTeams = new Map(
        [...results.teams.entries()].sort((a, b) => a[1].name.localeCompare(b[1].name))
    );
    results.teams = sortedTeams;

    // Log dos resultados para debug
    console.log('Times encontrados:', Array.from(results.teams.values()));
    console.log('Jogadores encontrados:', Array.from(results.players.values()));

    return results;
}

// Função para renderizar os resultados
async function renderSearchResults(query) {
    const resultsDiv = document.getElementById('searchResults');
    resultsDiv.innerHTML = '<div class="searching-message">Buscando resultados...</div>';

    try {
        const { players, teams } = await searchBrazilianData(query);

        if (players.size === 0 && teams.size === 0) {
            resultsDiv.innerHTML = '<div class="no-results">Nenhum jogador ou time encontrado nas ligas principais.</div>';
            return;
        }

        let html = '<h2 class="results-title">Resultados da Busca</h2>';

        // Seção de Times
        if (teams.size > 0) {
            html += `
                <div class="teams-section">
                    <h3>Times</h3>
                    <div class="results-grid">
                        ${Array.from(teams.values()).map(team => renderTeamCard(team)).join('')}
                    </div>
                </div>
            `;
        }

        // Seção de Jogadores
        if (players.size > 0) {
            html += `
                <div class="players-section">
                    <h3>Jogadores</h3>
                    <div class="results-grid">
                        ${Array.from(players.values()).map(player => renderPlayerCard(player)).join('')}
                    </div>
                </div>
            `;
        }

        resultsDiv.innerHTML = html;
    } catch (error) {
        console.error('Erro ao processar resultados:', error);
        resultsDiv.innerHTML = '<div class="no-results">Erro ao processar os resultados. Tente novamente.</div>';
    }
}

// Atualização da renderização dos times
function renderTeamCard(team) {
    return `
        <div class="card team-card">
            <div class="team-header">
                <img src="${team.logo}" alt="${team.name}" class="team-logo">
            </div>
            <div class="team-info">
                <h3>${team.name}</h3>
                <p class="team-location">${team.city !== 'Brasil' ? `${team.city}, ` : ''}${team.country}</p>
                <p class="team-leagues">Competições: ${team.leagues.join(', ')}</p>
                ${team.founded ? `<p>Fundado em: ${team.founded}</p>` : ''}
                ${team.venue ? `
                    <div class="venue-info">
                        <p>Estádio: ${team.venue.name || 'Não informado'}</p>
                        <p>Capacidade: ${team.venue.capacity ? team.venue.capacity.toLocaleString() : 'Não informada'}</p>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// Atualização da renderização dos jogadores
function renderPlayerCard(player) {
    return `
        <div class="card player-card">
            <div class="player-photo-container">
                <img src="${player.photo}" alt="${player.name}" class="player-photo" onerror="this.src='assets/img/player-placeholder.png'">
                ${player.team?.logo ? 
                    `<img src="${player.team.logo}" alt="${player.team.name}" class="team-logo-overlay" onerror="this.src='assets/img/team-placeholder.png'">` 
                    : ''}
            </div>
            <div class="player-info">
                <h3>${player.name}</h3>
                <p>Idade: ${player.age}</p>
                <p>Nacionalidade: ${player.nationality === 'Brazil' ? 'Brasil' : player.nationality}</p>
                <p>Time: ${player.team?.name || 'Não informado'}</p>
                <p>Competições: ${player.leagues.join(', ')}</p>
            </div>
        </div>
    `;
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