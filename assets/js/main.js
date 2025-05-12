import { fetchFromAPI } from './api.js';
import { 
  saveToFavorites, 
  isFavorite, 
  getFavorites, 
  syncFavoriteButtons, 
  FAVORITES_CHANGED_EVENT 
} from './favorites.js';

// Configuração das ligas brasileiras
const BRAZILIAN_LEAGUES = [
  { id: 71, name: 'Brasileirão Série A' },
  { id: 72, name: 'Brasileirão Série B' },
  { id: 75, name: 'Brasileirão Série C' },
  { id: 76, name: 'Brasileirão Série D' },
  { id: 73, name: 'Copa do Brasil' }
];

// DOM elements
let currentDate = new Date();
const prevBtn = document.getElementById('prevDay');
const nextBtn = document.getElementById('nextDay');
const dateSpan = document.getElementById('currentDate');
const gamesDiv = document.getElementById('gamesList');
const favoriteTeamsContainer = document.getElementById('favoriteTeams');
const favoritePlayersContainer = document.getElementById('favoritePlayers');
const leagueSelect = document.getElementById('leagueSelect');
const groupSelect = document.getElementById('groupSelect');
const standingsList = document.getElementById('standingsList');

function formatBR(d) {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function isSameLocalDate(utcDateStr, selectedDate) {
  const gameDate = new Date(utcDateStr);
  return (
    gameDate.getFullYear() === selectedDate.getFullYear() &&
    gameDate.getMonth() === selectedDate.getMonth() &&
    gameDate.getDate() === selectedDate.getDate()
  );
}

function renderFavorites() {
  const fav = getFavorites();
  favoriteTeamsContainer.innerHTML = fav.teams.slice(0, 3).map(t => `
    <div class="favorite-card">
      <img src="${t.logo}" alt="${t.name}" class="team-favorite-logo">
      <div class="favorite-name">${t.name}</div>
    </div>
  `).join('') || '<p>Nenhum time favorito.</p>';
  favoritePlayersContainer.innerHTML = fav.players.slice(0, 3).map(p => `
    <div class="favorite-card">
      <img src="${p.photo}" alt="${p.name}" class="player-favorite-photo">
      <div class="favorite-name">${p.name}</div>
    </div>
  `).join('') || '<p>Nenhum jogador favorito.</p>';
}

async function loadGamesForDate() {
  gamesDiv.innerHTML = '<div class="loading">Carregando...</div>';
  const dateStr = currentDate.toISOString().split('T')[0];
  try {
    const { response } = await fetchFromAPI(`fixtures?date=${dateStr}`);
    const jogos = response.filter(fx => 
      [71,72,75,76,73].includes(fx.league.id) &&
      isSameLocalDate(fx.fixture.date, currentDate)
    );
    if (!jogos.length) {
      gamesDiv.innerHTML = '<p>Nenhum jogo encontrado.</p>';
      return;
    }
    // agrupar por liga
    const byLeague = jogos.reduce((acc, g) => {
      const leagueName = BRAZILIAN_LEAGUES.find(l => l.id === g.league.id).name;
      if (!acc[leagueName]) acc[leagueName] = { name: leagueName, logoApi: g.league.logo, games: [] };
      acc[leagueName].games.push(g);
      return acc;
    }, {});
    const order = ['Copa do Brasil','Brasileirão Série A','Brasileirão Série B','Brasileirão Série C','Brasileirão Série D'];
    const ordered = order.filter(name => byLeague[name]).map(name => byLeague[name]);
    gamesDiv.innerHTML = ordered.map(block => `
      <div class="league-section">
        <div class="league-header">
          <img src="${block.logoApi}" alt="${block.name}" class="league-logo">
          <h3>${block.name}</h3>
        </div>
        <div class="matches-container">
          ${block.games.map(match => {
            const home = match.teams.home;
            const away = match.teams.away;
            const status = match.fixture.status.short;
            const isFT = status === 'FT';
            const isNS = status === 'NS';
            const isLive = !isFT && status !== 'NS';
            const scoreH = match.goals.home ?? '-';
            const scoreA = match.goals.away ?? '-';
            return `
              <a href="match.html?matchId=${match.fixture.id}" class="game-link">
                <div class="game-card${isFT?' finished':''}">
                  ${isNS?`<div class="badge scheduled">${new Date(match.fixture.date).toLocaleTimeString('pt-BR')}</div>`:''}
                  <div class="score-container">
                    <span class="score">${scoreH} x ${scoreA}</span>
                    ${isLive?`<div class="badge live">${match.fixture.status.elapsed}'</div>`:''}
                  </div>
                  <div class="match-teams">
                    <div class="team">
                      <img src="${home.logo}" alt="${home.name}" class="team-logo">
                      <span class="team-name">${home.name}</span>
                    </div>
                    <div class="team">
                      <span class="team-name">${away.name}</span>
                      <img src="${away.logo}" alt="${away.name}" class="team-logo">
                    </div>
                  </div>
                </div>
              </a>
            `;
          }).join('')}
        </div>
      </div>
    `).join('');
  } catch (err) {
    gamesDiv.innerHTML = '<p>Erro ao carregar jogos.</p>';
    console.error(err);
  }
}

async function loadStandings(leagueId, group = 0) {
  standingsList.innerHTML = '<div class="loading">Carregando classificação...</div>';
  const season = new Date().getFullYear();
  if (+leagueId === 73) {
    standingsList.innerHTML = '<p>Formato eliminatório.</p>';
    groupSelect.style.display = 'none';
    return;
  }
  const { response } = await fetchFromAPI(`standings?league=${leagueId}&season=${season}`);
  let data = response[0]?.league?.standings;
  if (+leagueId === 76) {
    groupSelect.style.display = 'inline-block';
    groupSelect.innerHTML = data.map((_,i)=>`<option value="${i}">Grupo ${String.fromCharCode(65+i)}</option>`).join('');
    data = data[group] || [];
  } else {
    groupSelect.style.display = 'none';
    data = data[0] || [];
  }
  if (!data.length) {
    standingsList.innerHTML = '<p>Nenhuma classificação disponível.</p>';
    return;
  }
  standingsList.innerHTML = `
    <table class="standings-table">
      <thead>
        <tr><th>#</th><th>Time</th><th>Pts</th><th>J</th><th>V</th><th>E</th><th>D</th><th>SG</th></tr>
      </thead>
      <tbody>
        ${data.map((r,i,arr)=>`
          <tr class="${i<4?'highlight-top':''}${i>=arr.length-4?' highlight-bottom':''}">
            <td>${r.rank}</td>
            <td><img src="${r.team.logo}" class="stand-team-logo"/> ${r.team.name}</td>
            <td>${r.points}</td>
            <td>${r.all.played}</td>
            <td>${r.all.win}</td>
            <td>${r.all.draw}</td>
            <td>${r.all.lose}</td>
            <td>${r.goalsDiff}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function changeDay(offset) {
  currentDate.setDate(currentDate.getDate() + offset);
  dateSpan.textContent = formatBR(currentDate);
  loadGamesForDate();
}

function init() {
  prevBtn.addEventListener('click', ()=>changeDay(-1));
  nextBtn.addEventListener('click', ()=>changeDay(1));
  leagueSelect.addEventListener('change', ()=>loadStandings(leagueSelect.value));
  groupSelect.addEventListener('change', ()=>loadStandings(leagueSelect.value,+groupSelect.value));
  dateSpan.textContent = formatBR(currentDate);
  renderFavorites();
  loadGamesForDate();
  loadStandings(leagueSelect.value);
  window.addEventListener('storage', ()=>{ renderFavorites(); syncFavoriteButtons(); });
}

document.addEventListener('DOMContentLoaded', init);
