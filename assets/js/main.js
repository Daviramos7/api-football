import { fetchFromAPI } from './api.js';

// Ligas principais do Brasil com IDs v3
const BRAZILIAN_LEAGUES = [
  { id: { v3: 71 }, name: 'Brasileirão Série A' },
  { id: { v3: 72 }, name: 'Brasileirão Série B' },
  { id: { v3: 75 }, name: 'Brasileirão Série C' },
  { id: { v3: 76 }, name: 'Brasileirão Série D' },
  { id: { v3: 73 }, name: 'Copa do Brasil' }
];
const allowedIds = new Set(BRAZILIAN_LEAGUES.map(l => l.id.v3));

// Controle de data atual
let currentDate = new Date();
const prevBtn = document.getElementById('prevDay');
const nextBtn = document.getElementById('nextDay');
const dateSpan = document.getElementById('currentDate');
const gamesDiv = document.getElementById('gamesList');

// Eventos dos botões de navegação
prevBtn.addEventListener('click', () => changeDay(-1));
nextBtn.addEventListener('click', () => changeDay(1));

// Muda o dia em currentDate e recarrega
function changeDay(offset) {
  currentDate.setDate(currentDate.getDate() + offset);
  loadGamesForDate();
}

// Formata data para pt-BR
function formatBR(d) {
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// Carrega e renderiza jogos do dia selecionado
async function loadGamesForDate() {
  dateSpan.textContent = formatBR(currentDate);
  gamesDiv.innerHTML = '<p>Carregando jogos...</p>';

  const dateStr = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
  try {
    const { response } = await fetchFromAPI(`fixtures?date=${dateStr}`);
    const jogos = response.filter(fx => allowedIds.has(fx.league.id));

    if (jogos.length === 0) {
      gamesDiv.innerHTML = '<p>Não há jogos destes campeonatos nesta data.</p>';
      return;
    }

    // Agrupa por liga
    const byLeague = jogos.reduce((acc, g) => {
      const lid = g.league.id;
      if (!acc[lid]) {
        acc[lid] = {
          name: BRAZILIAN_LEAGUES.find(l => l.id.v3 === lid).name,
          games: []
        };
      }
      acc[lid].games.push(g);
      return acc;
    }, {});

    // Renderiza blocos por liga
    gamesDiv.innerHTML = Object.values(byLeague).map(block => {
      return `
        <div class="league">
          <div class="league-header">
            <h3>${block.name}</h3>
          </div>
          <div class="games">
            ${block.games
              .map(g => {
                const status = g.fixture.status.short;
                const isNS = status === 'NS';
                const isFinished = status === 'FT';
                const home = g.teams.home;
                const away = g.teams.away;
                const scoreH = g.goals.home ?? '-';
                const scoreA = g.goals.away ?? '-';
                const dateObj = new Date(g.fixture.date);
                const timeBR = dateObj.toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit'
                });

                // Badge conforme status
                let badgeHTML = '';
                if (isNS) {
                  badgeHTML = `<div class="badge scheduled">${timeBR}</div>`;
                } else if (!isFinished) {
                  badgeHTML = `<div class="badge live">${g.fixture.status.elapsed}'</div>`;
                }

                // Link para página de detalhes
                const matchUrl = `partida.html?id=${g.fixture.id}`;

                return `
                  <a href="${matchUrl}" class="game-link">
                    <div class="game-card ${isFinished ? 'finished' : ''}">
                      ${badgeHTML}
                      <div class="logos">
                        <img src="${home.logo}" alt="${home.name}" class="team-logo left">
                        <span class="score">${scoreH} x ${scoreA}</span>
                        <img src="${away.logo}" alt="${away.name}" class="team-logo right">
                      </div>
                      <p class="teams">${home.name} vs ${away.name}</p>
                    </div>
                  </a>
                `;
              })
              .join('')}
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Erro ao carregar jogos:', error);
    gamesDiv.innerHTML = '<p>Erro ao carregar jogos. Tente novamente.</p>';
  }
}

// Inicializa na data de hoje
loadGamesForDate();
