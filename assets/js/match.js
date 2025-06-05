import { fetchFromAPI } from './api.js';

async function loadMatchDetails(matchId) {
    const container = document.getElementById('matchDetails');
    const descContainer = document.getElementById('matchDescription');
    const standingsContainer = document.getElementById('standingsCard');

    // Exibe loading em todos os contêineres relevantes
    if (container) container.innerHTML = '<p class="loading-message">Carregando detalhes da partida...</p>';
    if (descContainer) descContainer.innerHTML = ''; // Limpa antes de carregar
    if (standingsContainer) standingsContainer.innerHTML = ''; // Limpa antes de carregar

    try {
        // 1) Dados da partida
        const matchData = await fetchFromAPI(`fixtures?id=${matchId}`);
        console.log('matchData →', matchData);
        const match = matchData.response?.[0] || {};
        const league = match.league || {};
        const teams = match.teams || { home: {}, away: {} };
        const fixture = match.fixture || {};
        const venue = fixture.venue || {};
        const goals = match.goals || { home: null, away: null };
        const score = match.score || { halftime: { home: null, away: null }, fulltime: { home: null, away: null } };

        if (!fixture.id) throw new Error('Partida não encontrada para o ID fornecido.');

        // 2) Data e hora
        const dt = new Date(fixture.date || Date.now());
        const dateOnly = isNaN(dt)
            ? '—'
            : dt.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            });
        const timeLocal = isNaN(dt)
            ? '—'
            : dt.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
            });
        const timeUTC = isNaN(dt)
            ? '—'
            : dt.toISOString().substr(11, 5);

        // 3) Ranking (requisição separada, mas se beneficia do cache)
        let homeRank = '—', awayRank = '—';
        let standings = [];
        // Garante que league.id e league.season existam e não seja a Copa do Brasil (73) que não tem classificação
        if (league.id && league.season && league.id !== 73) {
            const standData = await fetchFromAPI(
                `standings?league=${league.id}&season=${league.season}`
            );
            console.log('standData →', standData);
            // Para ligas com grupos (como a Série D), precisamos encontrar o grupo correto
            if (standData.response?.[0]?.league?.standings) {
                // Tenta encontrar o grupo ao qual os times da partida pertencem
                const allStandingsGroups = standData.response[0].league.standings;
                for (const group of allStandingsGroups) {
                    const homeTeamInGroup = group.find(r => r.team.id === teams.home.id);
                    const awayTeamInGroup = group.find(r => r.team.id === teams.away.id);
                    if (homeTeamInGroup || awayTeamInGroup) {
                        standings = group; // Encontrou o grupo relevante
                        homeRank = homeTeamInGroup?.rank ?? '—';
                        awayRank = awayTeamInGroup?.rank ?? '—';
                        break; // Sai do loop assim que o grupo é encontrado
                    }
                }
            }
        }

        // 4) Card da partida
        if (container) {
            container.innerHTML = `
                <div class="game-card match-card">
                    <div class="team-block">
                        <div class="badge-rank rank-${homeRank}">${homeRank}</div>
                        <img src="${teams.home.logo || 'assets/img/team-placeholder.png'}" alt="${teams.home.name || 'Time'}" class="team-logo-big" onerror="this.onerror=null; this.src='assets/img/team-placeholder.png'"/>
                        <div class="team-name">${teams.home.name || '—'}</div>
                    </div>
                    <div class="match-info-center">
                        <div class="match-date">${dateOnly}</div>
                        <div class="match-time">
                            ${fixture.status.short === 'NS' ? timeLocal : ''}
                            ${fixture.status.short === 'FT' ? `Finalizado` : ''}
                            ${fixture.status.short === 'HT' ? `Intervalo` : ''}
                            ${fixture.status.short === 'PST' ? `Adiado` : ''}
                            ${fixture.status.short === 'CANC' ? `Cancelado` : ''}
                            ${fixture.status.elapsed && fixture.status.short !== 'FT' && fixture.status.short !== 'HT' && fixture.status.short !== 'NS' ? `Ao Vivo (${fixture.status.elapsed}')` : ''}
                        </div>
                        <div class="match-score">
                            ${goals.home ?? '-'} x ${goals.away ?? '-'}
                        </div>
                        <div class="match-league">
                            ${
                                league.logo
                                    ? `<img src="${league.logo}" alt="${league.name}" class="league-logo-small" onerror="this.onerror=null; this.src='assets/img/league-placeholder.png'"/>`
                                    : ''
                            }
                            ${league.name || '—'}
                        </div>
                        <div class="match-venue">
                            <span>${venue.name || '—'}</span>,
                            <span>${venue.city || '—'}</span>,
                            <span>${venue.country || '—'}</span>
                        </div>
                    </div>
                    <div class="team-block">
                        <div class="badge-rank rank-${awayRank}">${awayRank}</div>
                        <img src="${teams.away.logo || 'assets/img/team-placeholder.png'}" alt="${teams.away.name || 'Time'}" class="team-logo-big" onerror="this.onerror=null; this.src='assets/img/team-placeholder.png'"/>
                        <div class="team-name">${teams.away.name || '—'}</div>
                    </div>
                </div>
            `;
        }

        // 5) Descrição
        if (descContainer) {
            let descriptionText = `
                <p>
                    <strong>${teams.home.name || 'Um time'}</strong> está enfrentando
                    <strong>${teams.away.name || 'Outro time'}</strong>, com início em
                    <strong>${dateOnly}</strong> às <strong>${timeLocal} (horário local)</strong> /
                    <strong>${timeUTC} UTC</strong> no estádio
                    <strong>${venue.name || 'desconhecido'}</strong>, ${venue.city || 'cidade desconhecida'}, ${venue.country || 'país desconhecido'}.
                </p>
            `;
            if (league.id && league.id !== 73) { // Não mostra rank se for Copa do Brasil
                descriptionText += `
                    <p>
                        A partida faz parte do <strong>${league.name || 'uma liga'}.</strong>
                        ${homeRank !== '—' ? `Atualmente, <strong>${teams.home.name || 'O time da casa'}</strong> está na ${homeRank}ª posição,` : ''}
                        ${awayRank !== '—' ? `e <strong>${teams.away.name || 'O time visitante'}</strong> está na ${awayRank}ª posição.` : ''}
                    </p>
                `;
            }
            descriptionText += `<p>Acompanhe o placar ao vivo e os detalhes da partida aqui!</p>`;
            descContainer.innerHTML = `<h2>Sobre a partida</h2>${descriptionText}`;
        }


        // 6) Classificação
        if (standingsContainer) {
            if (standings.length === 0 || league.id === 73) {
                standingsContainer.innerHTML = `
                    <div class="standings-card">
                        <h3>Classificação da Liga</h3>
                        <p class="no-results-message">${league.id === 73 ? 'Copa do Brasil tem formato eliminatório, sem classificação por pontos.' : 'Nenhuma classificação disponível para esta liga ou grupo.'}</p>
                    </div>
                `;
            } else {
                const rowsHtml = standings
                    .map(r => {
                        const isMatchTeam =
                            r.team.id === teams.home.id || r.team.id === teams.away.id;
                        const formArr = Array.isArray(r.form)
                            ? r.form
                            : typeof r.form === 'string'
                            ? Array.from(r.form)
                            : [];
                        const last5 = formArr
                            .slice(-5)
                            .map(s => {
                                if (s === 'W') return '<span class="form-win">V</span>';
                                if (s === 'D') return '<span class="form-draw">E</span>';
                                if (s === 'L') return '<span class="form-loss">D</span>';
                                return `<span>${s}</span>`; // Fallback for unexpected characters
                            })
                            .join(' ');

                        return `
                            <tr class="${isMatchTeam ? 'highlight-match-team' : ''}">
                                <td>${r.rank}</td>
                                <td>
                                    <img src="${r.team.logo}" alt="${r.team.name}" class="stand-team-logo" onerror="this.onerror=null; this.src='assets/img/team-placeholder.png'"/>
                                    ${r.team.name}
                                </td>
                                <td>${r.all.played}</td>
                                <td>${r.all.win}</td>
                                <td>${r.all.draw}</td>
                                <td>${r.all.lose}</td>
                                <td>${r.goalsDiff}</td>
                                <td class="form-cell">${last5}</td>
                            </tr>
                        `;
                    })
                    .join('');

                standingsContainer.innerHTML = `
                    <div class="standings-card">
                        <h3>Classificação da Liga</h3>
                        <table class="standings-table">
                            <thead>
                                <tr><th>#</th><th>Time</th><th>J</th><th>V</th><th>E</th><th>D</th><th>SG</th><th>Últ.5</th></tr>
                            </thead>
                            <tbody>${rowsHtml}</tbody>
                        </table>
                    </div>
                `;
            }
        }

    } catch (err) {
        console.error('Erro detalhado:', err);
        const errorMessage = err.message.includes('Limite de requisições diárias atingido')
            ? 'Não foi possível carregar os detalhes da partida. O limite de requisições da API foi atingido. Tente novamente amanhã.'
            : `Erro ao carregar detalhes da partida: ${err.message}. Tente novamente mais tarde.`;

        if (container) container.innerHTML = `<p class="error-message">${errorMessage}</p>`;
        if (descContainer) descContainer.innerHTML = '';
        if (standingsContainer) standingsContainer.innerHTML = '';
    }
}

// Captura ID da URL e dispara a função
const params = new URLSearchParams(window.location.search);
const matchId = params.get('id') || params.get('matchId'); // Aceita 'id' ou 'matchId'
if (matchId) {
    loadMatchDetails(matchId);
} else {
    const container = document.getElementById('matchDetails');
    if (container) {
        container.innerHTML = '<p class="error-message">ID da partida não fornecido na URL.</p>';
    }
    // Opcional: Limpar outros contêineres se o ID não for fornecido
    const descContainer = document.getElementById('matchDescription');
    const standingsContainer = document.getElementById('standingsCard');
    if (descContainer) descContainer.innerHTML = '';
    if (standingsContainer) standingsContainer.innerHTML = '';
}