const DATA_URL = "dados.json";
const GROUP_ORDER = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
const KNOCKOUT_PHASES = ["32avos de final", "Oitavas de final", "Quartas de final", "Semifinais", "Disputa 3º Lugar", "Final"];
const SPECIAL_FLAGS = {
  "gb-eng": "https://upload.wikimedia.org/wikipedia/en/b/be/Flag_of_England.svg",
  "gb-sct": "https://upload.wikimedia.org/wikipedia/commons/1/10/Flag_of_Scotland.svg"
};

let dadosGlobais = null;

document.addEventListener("DOMContentLoaded", () => {
  iniciarAplicacao();
});

async function iniciarAplicacao() {
  const container = document.getElementById("page-content");

  if (!container) {
    return;
  }

  container.innerHTML = '<div class="loading">Carregando dados da Copa 2026...</div>';

  try {
    const response = await fetch(DATA_URL, { cache: "no-store" });

    if (!response.ok) {
      throw new Error("Falha ao carregar o arquivo dados.json");
    }

    const data = await response.json();
    dadosGlobais = data;
    
    carregarDadosSalvos();
    
    const state = buildState(data);
    renderPage(state);
  } catch (error) {
    container.innerHTML = `
      <div class="error-state">
        <strong>Não foi possível carregar os dados.</strong>
        <p>${error.message}</p>
      </div>
    `;
  }
}

function buildState(data) {
  const teamLookup = {};

  data.groups.forEach((group) => {
    group.teams.forEach((team) => {
      teamLookup[team.code] = { ...team, group: group.id };
    });
  });

  const standings = {};

  data.groups.forEach((group) => {
    const baseRows = group.teams.map((team) => ({
      ...team,
      group: group.id,
      points: 0,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0
    }));

    standings[group.id] = baseRows;
  });

  data.fixtures.groupStage.forEach((fixture) => {
    if (!hasScore(fixture)) {
      return;
    }

    const homeRow = standings[fixture.group].find((team) => team.code === fixture.home);
    const awayRow = standings[fixture.group].find((team) => team.code === fixture.away);

    updateTeamStats(homeRow, fixture.score.home, fixture.score.away);
    updateTeamStats(awayRow, fixture.score.away, fixture.score.home);
  });

  GROUP_ORDER.forEach((groupId) => {
    standings[groupId] = standings[groupId]
      .map((team) => ({
        ...team,
        goalDiff: team.goalsFor - team.goalsAgainst
      }))
      .sort(compareStandings);
  });

  const bestThirdPlace = GROUP_ORDER
    .map((groupId) => standings[groupId][2])
    .filter(team => team && team.played > 0)
    .sort(compareStandings)
    .slice(0, 8)
    .map((team, index) => ({
      ...team,
      thirdPlaceSlot: `3V${index + 1}`
    }));

  const resolvedKnockout = resolveKnockout(data.fixtures.knockout, standings, bestThirdPlace, teamLookup);

  return {
    data,
    standings,
    teamLookup,
    bestThirdPlace,
    resolvedKnockout
  };
}

function updateTeamStats(team, goalsFor, goalsAgainst) {
  team.played += 1;
  team.goalsFor += goalsFor;
  team.goalsAgainst += goalsAgainst;

  if (goalsFor > goalsAgainst) {
    team.wins += 1;
    team.points += 3;
  } else if (goalsFor === goalsAgainst) {
    team.draws += 1;
    team.points += 1;
  } else {
    team.losses += 1;
  }
}

function compareStandings(a, b) {
  return (
    b.points - a.points ||
    b.goalDiff - a.goalDiff ||
    b.goalsFor - a.goalsFor ||
    b.wins - a.wins ||
    a.name.localeCompare(b.name, "pt-BR")
  );
}

function resolveKnockout(fixtures, standings, bestThirdPlace, teamLookup) {
  const winnersMap = {};
  const losersMap = {};
  const resolved = [];

  fixtures.forEach((fixture) => {
    const homeTeam = resolveSlot(fixture.homeSlot, standings, bestThirdPlace, winnersMap, losersMap, teamLookup);
    const awayTeam = resolveSlot(fixture.awaySlot, standings, bestThirdPlace, winnersMap, losersMap, teamLookup);
    const winner = determineWinner(fixture, homeTeam, awayTeam);
    const loser = determineLoser(fixture, homeTeam, awayTeam, winner);

    if (winner) {
      winnersMap[fixture.id] = winner;
    }
    if (loser) {
      losersMap[fixture.id] = loser;
    }

    resolved.push({
      ...fixture,
      homeTeam,
      awayTeam,
      winner,
      loser
    });
  });

  return resolved;
}

function resolveSlot(slot, standings, bestThirdPlace, winnersMap, losersMap, teamLookup) {
  if (!slot) {
    return null;
  }

  if (slot.startsWith("W-")) {
    return winnersMap[slot.replace("W-", "")] || null;
  }

  if (slot.startsWith("L-")) {
    return losersMap[slot.replace("L-", "")] || null;
  }

  const thirdPlaceMatch = slot.match(/^3V([1-8])$/);

  if (thirdPlaceMatch) {
    return bestThirdPlace[Number(thirdPlaceMatch[1]) - 1] || null;
  }

  const groupMatch = slot.match(/^([12])([A-L])$/);

  if (groupMatch) {
    const position = Number(groupMatch[1]) - 1;
    const groupId = groupMatch[2];
    const team = standings[groupId]?.[position];
    return (team && team.played > 0) ? team : null;
  }

  return teamLookup[slot] || null;
}

function determineWinner(fixture, homeTeam, awayTeam) {
  if (!homeTeam || !awayTeam || !hasScore(fixture)) {
    return null;
  }

  if (fixture.score.home > fixture.score.away) {
    return homeTeam;
  }

  if (fixture.score.away > fixture.score.home) {
    return awayTeam;
  }

  const homePens = fixture.penalties?.home;
  const awayPens = fixture.penalties?.away;

  if (Number.isInteger(homePens) && Number.isInteger(awayPens)) {
    return homePens > awayPens ? homeTeam : awayTeam;
  }

  return null;
}

function determineLoser(fixture, homeTeam, awayTeam, winner) {
  if (!homeTeam || !awayTeam || !hasScore(fixture) || !winner) {
    return null;
  }
  return winner === homeTeam ? awayTeam : homeTeam;
}

function hasScore(fixture) {
  return Number.isInteger(fixture.score?.home) && Number.isInteger(fixture.score?.away);
}

function renderPage(state) {
  const page = document.body.dataset.page;

  if (page === "grupos") {
    renderGroupsPage(state);
    return;
  }

  if (page === "horarios") {
    renderSchedulePage(state);
    return;
  }

  if (page === "matamata") {
    renderKnockoutPage(state);
  }
}

function renderGroupsPage(state) {
  const container = document.getElementById("page-content");
  const totalCompletedMatches = state.data.fixtures.groupStage.filter(hasScore).length;

  container.innerHTML = `
    <section class="stats-strip">
      <article class="stat-card">
        <strong>${state.data.groups.length}</strong>
        <span>Grupos oficiais carregados</span>
      </article>
      <article class="stat-card">
        <strong>${state.data.fixtures.groupStage.length}</strong>
        <span>Jogos na fase de grupos</span>
      </article>
      <article class="stat-card">
        <strong>32</strong>
        <span>Jogos no mata-mata</span>
      </article>
      <article class="stat-card">
        <strong>104</strong>
        <span>Total de jogos</span>
      </article>
    </section>

    <section class="section-card note-card">
      <strong>Formato oficial da Copa 2026 com 48 seleções</strong>
      <p>
        Com 48 seleções divididas em 12 grupos de 4, os dois melhores de cada grupo (24 equipes) e os 8 melhores terceiros colocados formam os 32 classificados.
        A chave começa nos <strong>32 avos de final e segue para oitavas, quartas, semifinais e final.</strong>
      </p>
    </section>

    <section class="section-card">
      <div class="section-header">
        <div>
          <h2>Melhores terceiros colocados</h2>
          <p>Os 8 melhores dentre os 12 terceiros colocados completam as 32 vagas do mata-mata.</p>
        </div>
      </div>
      <div class="best-list">
        ${state.bestThirdPlace.map((team) => `
          <article class="best-team">
            <span class="best-rank">${team.thirdPlaceSlot}</span>
            ${renderFlag(team)}
            <div class="team-meta">
              <strong>${team.name}</strong>
              <span>${team.points} pts • SG ${team.goalDiff >= 0 ? `+${team.goalDiff}` : team.goalDiff} • Grupo ${team.group}</span>
            </div>
          </article>
        `).join("")}
      </div>
    </section>

    <section class="groups-grid">
      ${state.data.groups.map((group) => renderGroupCard(group, state.standings[group.id])).join("")}
    </section>
  `;
}

function renderGroupCard(group, standings) {
  return `
    <article class="section-card group-card">
      <header class="group-head">
        <div>
          <h3>Grupo ${group.id}</h3>
          <span>${group.teams.map((team) => team.code).join(" • ")}</span>
        </div>
        <span>${group.teams.length} seleções</span>
      </header>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Seleção</th>
              <th>Pts</th>
              <th>J</th>
              <th>V</th>
              <th>E</th>
              <th>D</th>
              <th>GP</th>
              <th>GC</th>
              <th>SG</th>
            </tr>
          </thead>
          <tbody>
            ${standings.map((team, index) => `
              <tr class="${index < 2 ? "qualified" : ""}">
                <td>
                  <div class="team-cell">
                    ${renderFlag(team)}
                    <div>
                      <strong>${team.name}</strong>
                      <small>${team.code}</small>
                    </div>
                  </div>
                </td>
                <td><strong>${team.points}</strong></td>
                <td>${team.played}</td>
                <td>${team.wins}</td>
                <td>${team.draws}</td>
                <td>${team.losses}</td>
                <td>${team.goalsFor}</td>
                <td>${team.goalsAgainst}</td>
                <td>${team.goalDiff >= 0 ? `+${team.goalDiff}` : team.goalDiff}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </article>
  `;
}

function renderSchedulePage(state) {
  const container = document.getElementById("page-content");
  const groupStageMarkup = GROUP_ORDER.map((groupId) => {
    const group = state.data.groups.find((item) => item.id === groupId);
    const groupFixtures = state.data.fixtures.groupStage
      .filter((fixture) => fixture.group === groupId)
      .sort((a, b) => a.round - b.round);

    const rounds = [1, 2, 3].map((round) => ({
      round,
      matches: groupFixtures.filter((fixture) => fixture.round === round)
    }));

    return `
      <article class="section-card schedule-group">
        <div class="phase-title">
          <h2>Grupo ${groupId}</h2>
          <span>${group.teams.map((team) => team.name).join(" • ")}</span>
        </div>
        ${rounds.map((round) => `
          <div class="round-block">
            <h3 class="round-title">Rodada ${round.round}</h3>
            <div class="matches-grid">
              ${round.matches.map((fixture) => renderMatchCard({
                fixture,
                homeTeam: state.teamLookup[fixture.home],
                awayTeam: state.teamLookup[fixture.away]
              })).join("")}
            </div>
          </div>
        `).join("")}
      </article>
    `;
  }).join("");

  const knockoutMarkup = KNOCKOUT_PHASES.map((phase) => {
    const phaseMatches = state.resolvedKnockout.filter((fixture) => fixture.phase === phase);

    return `
      <section class="phase-wrapper">
        <div class="phase-title">
          <h2>${phase}</h2>
          <span>${phaseMatches.length} jogos</span>
        </div>
        <div class="matches-grid">
          ${phaseMatches.map((fixture) => renderMatchCard(fixture)).join("")}
        </div>
      </section>
    `;
  }).join("");

  container.innerHTML = `

    <section class="schedule-grid">
      ${groupStageMarkup}
    </section>

    <section class="section-card schedule-group">
      <div class="section-header">
        <div>
          <h2>Mata-mata</h2>
          <p>Clique em qualquer jogo para editar o placar!</p>
        </div>
      </div>
      <div class="schedule-grid">
        ${knockoutMarkup}
      </div>
    </section>
  `;
}

function renderKnockoutPage(state) {
  const container = document.getElementById("page-content");
  const qualifiedTeams = buildQualifiedTeams(state);
  const columns = KNOCKOUT_PHASES.map((phase) => {
    const matches = state.resolvedKnockout.filter((fixture) => fixture.phase === phase);

    return `
      <div class="bracket-column">
        <h3>${phase}</h3>
        ${matches.map((fixture) => renderBracketMatch(fixture)).join("")}
      </div>
    `;
  }).join("");

  container.innerHTML = `
    <section class="section-card note-card">
      <strong>Formato Copa 2026</strong>
      <p>
        Com 48 seleções, a chave começa nos 32 avos de final e segue para oitavas, quartas, semifinais e final.
        Os 12 líderes, 12 vice-líderes e os 8 melhores terceiros colocados formam os 32 classificados.
        <strong>Clique em qualquer confronto para editar o placar!</strong>
      </p>
    </section>

    <section class="section-card">
      <div class="section-header">
        <div>
          <h2>Classificados (32 seleções)</h2>
          <p>Lista dinâmica com líderes, vice-líderes e melhores terceiros colocados</p>
        </div>
      </div>
      <div class="qualified-grid">
        ${qualifiedTeams.map((team) => `
          <article class="qualified-card">
            ${renderFlag(team)}
            <div>
              <strong>${team.name}</strong>
              <span>${team.slotLabel} • ${team.group ? `Grupo ${team.group}` : "Mata-mata"}</span>
            </div>
          </article>
        `).join("")}
      </div>
    </section>

    <section class="section-card bracket-board">
      <div class="bracket-grid">
        ${columns}
      </div>
    </section>
  `;
}

function buildQualifiedTeams(state) {
  const champions = GROUP_ORDER
    .filter(groupId => state.standings[groupId][0].played > 0)
    .map((groupId) => ({
      ...state.standings[groupId][0],
      slotLabel: `1${groupId}`
    }));

  const runnersUp = GROUP_ORDER
    .filter(groupId => state.standings[groupId][1].played > 0)
    .map((groupId) => ({
      ...state.standings[groupId][1],
      slotLabel: `2${groupId}`
    }));

  const bestThirdPlace = state.bestThirdPlace.map((team) => ({
    ...team,
    slotLabel: team.thirdPlaceSlot
  }));

  return [...champions, ...runnersUp, ...bestThirdPlace];
}

function renderMatchCard(item) {
  const fixture = item.fixture || item;
  const homeTeam = item.homeTeam || fixture.homeTeam || null;
  const awayTeam = item.awayTeam || fixture.awayTeam || null;
  const scoreLabel = formatScore(fixture);

  return `
    <article class="match-card" data-jogo-id="${fixture.id}" onclick="editarPlacar('${fixture.id}')">
      <div class="match-meta">
        <span>${formatDate(fixture.date)}</span>
        <span>${fixture.time}</span>
        <span>${fixture.stadium || fixture.phase || `Grupo ${fixture.group}`}</span>
      </div>
      <div class="match-body">
        ${renderMatchTeam(homeTeam, fixture.homeSlot)}
        <div class="score-badge">${scoreLabel}</div>
        ${renderMatchTeam(awayTeam, fixture.awaySlot, true)}
      </div>
    </article>
  `;
}

function renderBracketMatch(fixture) {
  const winnerText = fixture.winner ? `
    <div class="winner-tag">🏆 Classificado: ${fixture.winner.name}</div>
  ` : "";

  return `
    <article class="bracket-match" data-jogo-id="${fixture.id}" onclick="editarPlacar('${fixture.id}')">
      <div class="bracket-top">
        <span>${fixture.id}</span>
        <span>${formatDate(fixture.date)} • ${fixture.time}</span>
      </div>
      <div class="bracket-teams">
        <div class="bracket-team">
          ${renderMatchTeam(fixture.homeTeam, fixture.homeSlot)}
          <span class="team-score">${displayScoreSide(fixture.score?.home)}</span>
        </div>
        <div class="bracket-team">
          ${renderMatchTeam(fixture.awayTeam, fixture.awaySlot)}
          <span class="team-score">${displayScoreSide(fixture.score?.away)}</span>
        </div>
      </div>
      ${winnerText}
    </article>
  `;
}

function renderMatchTeam(team, slot, away = false) {
  const teamName = team?.name || "A definir";
  const teamCode = team?.code || slot || "slot";

  return `
    <div class="match-team ${away ? "away" : ""}">
      ${team ? renderFlag(team) : ""}
      <div>
        <strong>${teamName}</strong>
        <small>${team ? teamCode : `Origem ${slot || "pendente"}`}</small>
      </div>
    </div>
  `;
}

function renderFlag(team) {
  return `<img src="${flagUrl(team.flagCode)}" alt="Bandeira de ${team.name}" loading="lazy">`;
}

function flagUrl(flagCode) {
  const normalizedCode = String(flagCode).toLowerCase();
  return SPECIAL_FLAGS[normalizedCode] || `https://flagcdn.com/${normalizedCode}.svg`;
}

function formatDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12, 0, 0);

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
}

function formatScore(fixture) {
  if (!hasScore(fixture)) {
    return "—";
  }

  const base = `${fixture.score.home} x ${fixture.score.away}`;

  if (Number.isInteger(fixture.penalties?.home) && Number.isInteger(fixture.penalties?.away)) {
    return `${base} (${fixture.penalties.home}p-${fixture.penalties.away}p)`;
  }

  return base;
}

function displayScoreSide(value) {
  return Number.isInteger(value) ? value : "—";
}

let modalAtivo = null;
let jogoEditando = null;
let limpezaCompleta = false;

function editarPlacar(jogoId) {
  if (!dadosGlobais) {
    console.error("Dados não carregados");
    return;
  }
  
  let jogo = dadosGlobais.fixtures.groupStage.find(f => f.id === jogoId);
  let isKnockout = false;
  
  if (!jogo) {
    jogo = dadosGlobais.fixtures.knockout.find(f => f.id === jogoId);
    isKnockout = true;
  }
  
  if (!jogo) {
    console.error("Jogo não encontrado");
    return;
  }
  
  const homeTeam = getTeamByCode(jogo.home);
  const awayTeam = getTeamByCode(jogo.away);
  
  const homeNome = homeTeam ? homeTeam.name : (jogo.homeSlot || "Time A");
  const awayNome = awayTeam ? awayTeam.name : (jogo.awaySlot || "Time B");
  const homeFlag = homeTeam ? homeTeam.flagCode : null;
  const awayFlag = awayTeam ? awayTeam.flagCode : null;
  
  const golsAtuaisHome = jogo.score?.home !== null && jogo.score?.home !== undefined ? jogo.score.home : 0;
  const golsAtuaisAway = jogo.score?.away !== null && jogo.score?.away !== undefined ? jogo.score.away : 0;
  
  jogoEditando = { jogo, isKnockout, homeNome, awayNome, homeFlag, awayFlag };
  
  criarModal(homeNome, awayNome, homeFlag, awayFlag, golsAtuaisHome, golsAtuaisAway);
}

function criarModal(homeNome, awayNome, homeFlag, awayFlag, golsHome, golsAway) {
  limpezaCompleta = false;
  
  if (modalAtivo) {
    modalAtivo.remove();
  }
  
  const bandeiraHome = homeFlag ? `<img src="${flagUrl(homeFlag)}" style="width:42px;height:28px;border-radius:6px;margin-bottom:8px;box-shadow:0 2px 8px rgba(0,0,0,0.3);" onerror="this.style.display='none'">` : "🏠";
  const bandeiraAway = awayFlag ? `<img src="${flagUrl(awayFlag)}" style="width:42px;height:28px;border-radius:6px;margin-bottom:8px;box-shadow:0 2px 8px rgba(0,0,0,0.3);" onerror="this.style.display='none'">` : "✈️";
  
  const modalHTML = `
    <div class="modal-overlay" id="placarModal">
      <div class="modal-container">
        <div class="modal-header">
          <h3>Editar Placar</h3>
          <button class="modal-close" onclick="fecharModal()">×</button>
        </div>
        <div class="modal-body">
          <div class="confronto-nomes opcao2">
            <div class="time-casa">
              <div class="flag-top">${bandeiraHome}</div>
              <div class="time-nome">${homeNome}</div>
            </div>
            <div class="confronto-vs">VS</div>
            <div class="time-fora">
              <div class="flag-top">${bandeiraAway}</div>
              <div class="time-nome">${awayNome}</div>
            </div>
          </div>
          
          <div class="placar-inputs">
            <div class="input-group">
              <label>Gols</label>
              <input type="number" id="golsCasa" value="${golsHome}" min="0" step="1">
            </div>
            <div class="placar-x">×</div>
            <div class="input-group">
              <label>Gols</label>
              <input type="number" id="golsFora" value="${golsAway}" min="0" step="1">
            </div>
          </div>
          
          <!-- Botão Limpar -->
          <div class="limpar-container">
            <button type="button" class="modal-btn-limpar" onclick="limparPlacar()">
              🧹 Limpar placar
            </button>
          </div>
        </div>
        <div class="modal-footer">
          <button class="modal-btn modal-btn-cancelar" onclick="fecharModal()">Cancelar</button>
          <button class="modal-btn modal-btn-salvar" onclick="salvarPlacarModal()">Salvar</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  modalAtivo = document.getElementById('placarModal');
  
  setTimeout(() => {
    modalAtivo.classList.add('active');
    const primeiroInput = modalAtivo.querySelector('input');
    if (primeiroInput) primeiroInput.focus();
  }, 10);
  
  modalAtivo.addEventListener('click', (e) => {
    if (e.target === modalAtivo) {
      fecharModal();
    }
  });
  
  const inputs = modalAtivo.querySelectorAll('input');
  inputs.forEach(input => {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        salvarPlacarModal();
      }
    });
  });
}

function limparPlacar() {
  const inputCasa = document.getElementById('golsCasa');
  const inputFora = document.getElementById('golsFora');
  
  if (inputCasa && inputFora) {
    limpezaCompleta = true;
    
    inputCasa.value = 0;
    inputFora.value = 0;
    
    const btnLimpar = document.querySelector('.modal-btn-limpar');
    const textoOriginal = btnLimpar.innerHTML;
    btnLimpar.innerHTML = '🗑️ Clique em SALVAR para remover o placar';
    btnLimpar.style.background = 'rgba(239, 51, 64, 0.2)';
    btnLimpar.style.borderColor = '#ef3340';
    btnLimpar.style.color = '#ef3340';
    
    setTimeout(() => {
      if (btnLimpar) {
        btnLimpar.innerHTML = textoOriginal;
        btnLimpar.style.background = '';
        btnLimpar.style.borderColor = '';
        btnLimpar.style.color = '';
      }
    }, 2000);
  }
}

function fecharModal() {
  if (modalAtivo) {
    modalAtivo.classList.remove('active');
    setTimeout(() => {
      if (modalAtivo) modalAtivo.remove();
      modalAtivo = null;
      jogoEditando = null;
    }, 300);
  }
}

function salvarPlacarModal() {
  if (!jogoEditando) return;
  
  const golsCasa = parseInt(document.getElementById('golsCasa')?.value) || 0;
  const golsFora = parseInt(document.getElementById('golsFora')?.value) || 0;
  
  const { jogo, isKnockout, homeNome, awayNome } = jogoEditando;
  
  if (limpezaCompleta) {
    jogo.score = { home: null, away: null };
    if (!isKnockout) {
      jogo.status = "nao_iniciado";
    }
    mostrarToast(`Placar de ${homeNome} vs ${awayNome} foi removido!`);
    
    limpezaCompleta = false;
  } 
  else {
    jogo.score = { home: golsCasa, away: golsFora };
    if (!isKnockout) {
      jogo.status = "finalizado";
    }
    
    if (golsCasa === 0 && golsFora === 0) {
      mostrarToast(`⚽ ${homeNome} 0 x 0 ${awayNome} - Empate sem gols!`);
    } else {
      mostrarToast(`${homeNome} ${golsCasa} x ${golsFora} ${awayNome}`);
    }
  }
  
  salvarDadosNoLocalStorage();
  
  const novoState = buildState(dadosGlobais);
  renderPage(novoState);
  
  fecharModal();
}

function mostrarToast(mensagem) {
  const toastExistente = document.querySelector('.toast-mensagem');
  if (toastExistente) toastExistente.remove();
  
  const toast = document.createElement('div');
  toast.className = 'toast-mensagem';
  toast.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;">
      <span style="font-size:1.5rem;">✅</span>
      <span>${mensagem}</span>
    </div>
  `;
  toast.style.cssText = `
    position: fixed;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #0a1c33, #07111f);
    border: 1px solid rgba(102, 226, 155, 0.5);
    border-radius: 50px;
    padding: 12px 24px;
    color: #9ff3bf;
    font-weight: 600;
    z-index: 1001;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    backdrop-filter: blur(10px);
    animation: fadeInUp 0.3s ease, fadeOut 0.3s ease 2s forwards;
    font-size: 0.9rem;
  `;
  
  if (!document.querySelector('#toast-animations')) {
    const style = document.createElement('style');
    style.id = 'toast-animations';
    style.textContent = `
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateX(-50%) translateY(20px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
      @keyframes fadeOut {
        to { opacity: 0; transform: translateX(-50%) translateY(20px); }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    if (toast && toast.parentNode) toast.remove();
  }, 2500);
}

function salvarDadosNoLocalStorage() {
  if (dadosGlobais) {
    localStorage.setItem("copa2026_dados", JSON.stringify(dadosGlobais));
    console.log("✅ Dados salvos no localStorage");
  }
}

function carregarDadosSalvos() {
  const salvos = localStorage.getItem("copa2026_dados");
  if (salvos && dadosGlobais) {
    try {
      const dadosSalvos = JSON.parse(salvos);
      
      if (dadosSalvos.fixtures && dadosSalvos.fixtures.groupStage) {
        dadosSalvos.fixtures.groupStage.forEach(jogoSalvo => {
          const jogoOriginal = dadosGlobais.fixtures.groupStage.find(j => j.id === jogoSalvo.id);
          if (jogoOriginal && jogoSalvo.score) {
            jogoOriginal.score = { ...jogoSalvo.score };
            jogoOriginal.status = jogoSalvo.status;
          }
        });
      }
      
      if (dadosSalvos.fixtures && dadosSalvos.fixtures.knockout) {
        dadosSalvos.fixtures.knockout.forEach(jogoSalvo => {
          const jogoOriginal = dadosGlobais.fixtures.knockout.find(j => j.id === jogoSalvo.id);
          if (jogoOriginal && jogoSalvo.score) {
            jogoOriginal.score = { ...jogoSalvo.score };
          }
        });
      }
      
      console.log("✅ Dados carregados do localStorage");
    } catch (e) {
      console.error("Erro ao carregar dados salvos:", e);
    }
  }
}

function getTeamByCode(code) {
  if (!code || !dadosGlobais) return null;
  for (const group of dadosGlobais.groups) {
    const team = group.teams.find(t => t.code === code);
    if (team) return { ...team, name: team.name, flagCode: team.flagCode, code: team.code };
  }
  return null;
}