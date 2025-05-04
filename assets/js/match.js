// assets/js/match.js

import { fetchFromAPI } from './api.js';

async function loadMatchDetails(matchId) {
  const container = document.getElementById('matchDetails');
  const descContainer = document.getElementById('matchDescription');
  const standingsContainer = document.getElementById('standingsCard');

  // Limpa e exibe loading
  container.innerHTML = '<p>Carregando detalhes...</p>';
  descContainer.innerHTML = '';
  standingsContainer.innerHTML = '';

  try {
    // 1) Dados da partida
    const matchData = await fetchFromAPI(`fixtures?id=${matchId}`);
    const match = matchData.response?.[0] || {};
    const league = match.league || {};
    const teams = match.teams || { home: {}, away: {} };
    const fixture = match.fixture || {};
    const venue = fixture.venue || {};

    if (!fixture.id) throw new Error('Partida não encontrada');

    // 2) Formatação de data/hora
    const dt = new Date(fixture.date || Date.now());
    const dateOnly = isNaN(dt)
      ? '—'
      : dt.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
    const timeOnly = isNaN(dt)
      ? '—'
      : dt.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        });

    // 3) Ranking das equipes
    let homeRank = '—',
      awayRank = '—';
    let standings = [];
    if (league.id && league.season) {
      const standData = await fetchFromAPI(
        `standings?league=${league.id}&season=${league.season}`
      );
      standings =
        standData.response?.[0]?.league?.standings?.[0] ||
        [];
      const hr = standings.find((r) => r.team.id === teams.home.id);
      const ar = standings.find((r) => r.team.id === teams.away.id);
      homeRank = hr?.rank ?? '—';
      awayRank = ar?.rank ?? '—';
    }

    // 4) Renderiza card da partida
    container.innerHTML = `
      <div class="game-card match-card">
        <div class="team-block">
          <div class="badge-rank rank-${homeRank}">${homeRank}</div>
          <img src="${teams.home.logo || ''}"
               alt="${teams.home.name || 'Time'}"
               class="team-logo-big"/>
          <div class="team-name">${teams.home.name || '—'}</div>
        </div>
        <div class="match-info-center">
          <div class="match-date">${dateOnly}</div>
          <div class="match-time">${timeOnly}</div>
          <div class="match-league">
            ${
              league.logo
                ? `<img src="${league.logo}"
                         alt="${league.name}"
                         class="league-logo-small"/>`
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
          <img src="${teams.away.logo || ''}"
               alt="${teams.away.name || 'Time'}"
               class="team-logo-big"/>
          <div class="team-name">${teams.away.name || '—'}</div>
        </div>
      </div>
    `;

    // 5) Renderiza descrição dinâmica
    descContainer.innerHTML = `
      <h2>Sobre a partida</h2>
      <p>
        <strong>${teams.home.name}</strong> está enfrentando
        <strong>${teams.away.name}</strong>, começando em
        <strong>${dateOnly}</strong> às <strong>${timeOnly} UTC</strong> no
        estádio <strong>${venue.name}</strong>, ${venue.city}, ${venue.country}.
      </p>
      <p>
        A partida faz parte do <strong>${league.name}</strong>.
        Neste momento, <strong>${teams.home.name}</strong> está na
        ${homeRank}ª posição, e <strong>${teams.away.name}</strong> está na
        ${awayRank}ª posição.
      </p>
        <p>
            O jogo está programado para começar em <strong>${timeOnly} UTC</strong>.
            Você pode acompanhar o placar ao vivo aqui mesmo, Boa sorte para ambos os times!
        </p>
      
    `;

    // 6) Renderiza card de classificação
    const rowsHtml = standings
      .map((r) => {
        const isMatchTeam =
          r.team.id === teams.home.id ||
          r.team.id === teams.away.id;

        // Converte string de 'form' em array de caracteres
        const formArr = Array.isArray(r.form)
          ? r.form
          : typeof r.form === 'string'
          ? Array.from(r.form)
          : [];

        const last5 = formArr
          .slice(-5)
          .map((s) => {
            if (s === 'W') return '<span class="form-win">V</span>';
            if (s === 'D') return '<span class="form-draw">E</span>';
            if (s === 'L') return '<span class="form-loss">D</span>';
            return `<span>${s}</span>`;
          })
          .join(' ');

        return `
          <tr class="${isMatchTeam ? 'highlight' : ''}">
            <td>${r.rank}</td>
            <td>
              <img src="${r.team.logo}" alt="${r.team.name}"
                   class="stand-team-logo"/>
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
        <h3>Classificação</h3>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Time</th>
              <th>J</th>
              <th>V</th>
              <th>E</th>
              <th>D</th>
              <th>SG</th>
              <th>Últ.5</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    console.error(err);
    container.innerHTML = `<p>Erro ao carregar detalhes da partida: ${err.message}</p>`;
    descContainer.innerHTML = '';
    standingsContainer.innerHTML = '';
  }
}

// Captura ID da URL e dispara o carregamento
const params = new URLSearchParams(window.location.search);
const matchId = params.get('id');
if (matchId) {
  loadMatchDetails(matchId);
} else {
  document.getElementById('matchDetails').innerHTML =
    '<p>ID da partida não fornecido.</p>';
}
