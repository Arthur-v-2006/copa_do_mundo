/* app.js */
const DATA_URL = "dados.json";
const GROUP_ORDER = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
const KNOCKOUT_PHASES = ["32avos de final", "Oitavas de final", "Quartas de final", "Semifinais", "Disputa 3º Lugar", "Final"];
const SPECIAL_FLAGS = {
  "gb-eng": "https://upload.wikimedia.org/wikipedia/en/b/be/Flag_of_England.svg",
  "gb-sct": "https://upload.wikimedia.org/wikipedia/commons/1/10/Flag_of_Scotland.svg"
};

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
          <p>Os confrontos da chave usam os slots calculados pelo JavaScript.</p>
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
        Os 12 líderes, 12 vice-líderes e os 8 melhores terceiros colocados formam os 32 classificados
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
    <article class="match-card">
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
    <div class="winner-tag">Classificado: ${fixture.winner.name}</div>
  ` : "";

  return `
    <article class="bracket-match">
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