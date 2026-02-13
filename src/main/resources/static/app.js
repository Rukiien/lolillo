// ====== Elementos del DOM (HTML) ======

const viewHome = document.querySelector(".view-home");
const viewProfile = document.querySelector(".view-profile");

const form = document.querySelector(".search-form");
const riotIdInput = document.querySelector(".riot-id");
const searchIcon = document.querySelector(".search-icon");

const profileName = document.querySelector("#profileName");
const profileSub = document.querySelector("#profileSub");
const backBtn = document.querySelector("#backBtn");

const profileIcon = document.querySelector("#profileIcon");
const profileLevel = document.querySelector("#profileLevel");

const resultsDiv = document.querySelector(".results");
const loadMoreBtn = document.querySelector("#loadMoreBtn");
const rankInfo = document.querySelector("#rankInfo");

// ====== Estado global para paginación ======

let currentPuuid = null;
let currentStart = 0;
const pageSize = 20;

// ====== Helpers ======

function showHomeView() {
  viewProfile.classList.add("hidden");
  viewHome.classList.remove("hidden");
}

function showProfileView() {
  viewHome.classList.add("hidden");
  viewProfile.classList.remove("hidden");
}

function parseRiotId(input) {
  const riotId = input.trim();
  const parts = riotId.split("#");

  const gameName = parts[0]?.trim();
  const tagLine = parts[1]?.trim();

  if (!gameName || !tagLine) return null;
  return { gameName, tagLine };
}

function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${minutes}:${String(sec).padStart(2, "0")}`;
}

// ====== Routing (URL tipo DeepLoL) ======

function buildSummonerPath(gameName, tagLine) {
  return `/summoner/${encodeURIComponent(gameName)}-${encodeURIComponent(tagLine)}`;
}

function parseSummonerPath(pathname) {
  const prefix = "/summoner/";
  if (!pathname.startsWith(prefix)) return null;

  const slug = pathname.slice(prefix.length);
  const parts = slug.split("-");

  if (parts.length < 2) return null;

  const tagLine = decodeURIComponent(parts.pop());
  const gameName = decodeURIComponent(parts.join("-"));

  if (!gameName || !tagLine) return null;
  return { gameName, tagLine };
}

// ====== Render: desplegable match-details (Blue/Red) ======

function renderMatchDetailsTable(details) {
  const ddragonVersion = "13.24.1";

  const blueMaxDmg = Math.max(...details.blue.map((p) => p.damageToChamps));
  const redMaxDmg = Math.max(...details.red.map((p) => p.damageToChamps));

  const blueHeaderClass = details.blueWin ? "win" : "lose";
  const redHeaderClass = details.blueWin ? "lose" : "win";

  const blueHtml = renderTeamTable(details.blue, blueMaxDmg, ddragonVersion);
  const redHtml = renderTeamTable(details.red, redMaxDmg, ddragonVersion);

  return `
    <div class="team-block">
      <div class="team-header ${blueHeaderClass}">
        <span>Blue Team</span>
        <span class="small">${details.blueWin ? "WIN" : "LOSE"}</span>
      </div>
      ${blueHtml}
    </div>

    <div class="team-block" style="margin-top:12px;">
      <div class="team-header ${redHeaderClass}">
        <span>Red Team</span>
        <span class="small">${details.blueWin ? "LOSE" : "WIN"}</span>
      </div>
      ${redHtml}
    </div>
  `;
}

function renderTeamTable(players, maxDmg, ddragonVersion) {
  const rows = players
    .map((p) => {
      const kdaRatio = ((p.kills + p.assists) / Math.max(1, p.deaths)).toFixed(2);
      const dmgPct = maxDmg > 0 ? Math.round((p.damageToChamps / maxDmg) * 100) : 0;

      const itemsHtml = (p.items || [])
        .map(
          (id) => `
            <img
              class="item-icon"
              src="https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/item/${id}.png"
              alt="item ${id}"
              loading="lazy"
              onerror="this.style.display='none'"
            />
          `
        )
        .join("");

      return `
        <tr>
          <td>
            <div class="player-cell">
              <img
                class="champ-mini"
                src="https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/champion/${p.championName}.png"
                alt="${p.championName}"
                onerror="this.style.display='none'"
              />
              <div>
                <div><strong>${p.riotId || "—"}</strong></div>
                <div class="small">${p.championName} · Lv ${p.champLevel}</div>
              </div>
            </div>
          </td>

          <td>
            <div><strong>${p.kills}/${p.deaths}/${p.assists}</strong></div>
            <div class="small">${kdaRatio} KDA</div>
          </td>

          <td>
            <div><strong>${p.damageToChamps}</strong></div>
            <div class="damage-bar-wrap" style="margin-top:6px;">
              <div class="damage-bar" style="width:${dmgPct}%"></div>
            </div>
          </td>

          <td>
            <div><strong>${p.cs}</strong></div>
            <div class="small">${(p.goldEarned / 1000).toFixed(1)}k gold</div>
          </td>

          <td>
            <div class="items-row">
              ${itemsHtml}
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <table class="team-table">
      <thead>
        <tr>
          <th>Player</th>
          <th>KDA</th>
          <th>Damage</th>
          <th>CS / Gold</th>
          <th>Items</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

// ====== Render: cards (append para paginación) ======

function wireMatchCard(card) {
  card.addEventListener("click", async () => {
    const isOpening = !card.classList.contains("expanded");
    card.classList.toggle("expanded");
    if (!isOpening) return;

    const matchId = card.dataset.matchId;
    const extra = card.querySelector(".match-extra");

    if (card.dataset.loaded === "true") return;

    try {
      extra.innerHTML = `<div class="small">Cargando detalles de la partida...</div>`;

      const res = await fetch(`/api/match-details?matchId=${encodeURIComponent(matchId)}`);
      if (!res.ok) throw new Error("No se pudo cargar match-details");

      const details = await res.json();

      extra.innerHTML = renderMatchDetailsTable(details);
      card.dataset.loaded = "true";
    } catch (e) {
      extra.innerHTML = `<p style="color:red;">Error: ${e.message}</p>`;
      console.error(e);
    }
  });
}

function appendMatchCards(summaries) {
  if (!Array.isArray(summaries) || summaries.length === 0) {
    if (loadMoreBtn) loadMoreBtn.classList.add("hidden");
    return;
  }

  const ddragonVersion = "13.24.1";

  const html = summaries
    .map((m) => {
      const resultClass = m.win ? "win" : "lose";
      const resultText = m.win ? "VICTORIA" : "DERROTA";
      const timeText = formatDuration(m.gameDurationSeconds);
      const position = m.position || "—";

      const kdaRatio = ((m.kills + m.assists) / Math.max(1, m.deaths)).toFixed(2);

      const cs = (m.totalMinionsKilled || 0) + (m.neutralMinionsKilled || 0);
      const minutes = m.gameDurationSeconds / 60;
      const csPerMin = minutes > 0 ? (cs / minutes).toFixed(1) : "0.0";

      const goldK = ((m.goldEarned || 0) / 1000).toFixed(1);

      const items = [m.item0, m.item1, m.item2, m.item3, m.item4, m.item5, m.item6];
      if (m.roleBoundItem && m.roleBoundItem !== 0) items.push(m.roleBoundItem);

      const itemsHtml = items
        .filter((id) => id && id !== 0)
        .map(
          (id) => `
            <img
              class="item-icon"
              src="https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/item/${id}.png"
              alt="item ${id}"
              loading="lazy"
              onerror="this.style.display='none'"
            />
          `
        )
        .join("");

      return `
        <div class="match-card ${resultClass}" data-match-id="${m.matchId}">
          <div class="match-top">
            <div style="display:flex; gap:12px; align-items:center;">
              <img
                src="https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/champion/${m.championName}.png"
                alt="${m.championName}"
                style="width:48px; height:48px; border-radius:12px;"
                onerror="this.style.display='none'"
              />
              <div>
                <div style="display:flex; gap:8px; align-items:center;">
                  <div class="match-champ">${m.championName}</div>
                  <span class="role-badge">${position}</span>
                </div>
                <div class="small">${resultText} · Duración ${timeText}</div>
              </div>
            </div>

            <div>
              <div class="match-kda">${m.kills}/${m.deaths}/${m.assists}</div>
              <div class="small">${kdaRatio} KDA</div>
              <div class="small">${cs} CS (${csPerMin}/min)</div>
              <div class="small">${goldK}k gold</div>
            </div>
          </div>

          <div class="items-row">
            ${itemsHtml || '<span class="small">Sin items</span>'}
          </div>

          <div class="match-extra">
            <div class="small">Haz click para cargar detalles...</div>
          </div>
        </div>
      `;
    })
    .join("");

  resultsDiv.insertAdjacentHTML("beforeend", html);

  const newCards = resultsDiv.querySelectorAll(".match-card:not([data-wired='true'])");
  newCards.forEach((card) => {
    card.dataset.wired = "true";
    wireMatchCard(card);
  });
}

// ====== Eventos ======

backBtn.addEventListener("click", () => {
  // reset mínimo
  currentPuuid = null;
  currentStart = 0;
  if (loadMoreBtn) loadMoreBtn.classList.add("hidden");

  showHomeView();
  history.pushState({}, "", "/");
});

// click en lupa => submit
searchIcon.addEventListener("click", () => {
  form.requestSubmit();
});

// Botón cargar más (solo UNA vez)
if (loadMoreBtn) {
  loadMoreBtn.addEventListener("click", () => {
    if (!currentPuuid) return;

    loadMoreBtn.disabled = true;
    loadMoreBtn.textContent = "Cargando...";

    fetch(
      `/api/match-summaries?puuid=${encodeURIComponent(currentPuuid)}&count=${pageSize}&start=${currentStart}`
    )
      .then((r) => {
        if (!r.ok) throw new Error("No se pudieron cargar más partidas");
        return r.json();
      })
      .then((summaries) => {
        appendMatchCards(summaries);
        currentStart += summaries.length;

        if (!summaries || summaries.length < pageSize) {
          loadMoreBtn.classList.add("hidden");
        }
      })
      .catch((e) => {
        console.error(e);
        alert("Error cargando más partidas");
      })
      .finally(() => {
        loadMoreBtn.disabled = false;
        loadMoreBtn.textContent = "Cargar más";
      });
  });
}

// Submit del buscador
form.addEventListener("submit", (event) => {
  event.preventDefault();

  const parsed = parseRiotId(riotIdInput.value);
  if (!parsed) {
    alert('Escribe el Riot ID con formato "Nombre#TAG" (ej: Pepito#EUW)');
    return;
  }

  const { gameName, tagLine } = parsed;

  history.pushState({}, "", buildSummonerPath(gameName, tagLine));
  showProfileView();

  // reset UI rápido
  profileName.textContent = `${gameName}#${tagLine}`;
  profileSub.textContent = "Cargando perfil…";
  if (rankInfo) rankInfo.innerHTML = `<div class="small">Cargando rank…</div>`;
  if (profileIcon) profileIcon.removeAttribute("src");
  if (profileLevel) profileLevel.textContent = "";

  resultsDiv.innerHTML = `<p class="small">Cargando partidas...</p>`;

  fetch(
    `/api/resolve?gameName=${encodeURIComponent(gameName)}&tagLine=${encodeURIComponent(tagLine)}`
  )
    .then((response) => {
      if (!response.ok) throw new Error("Jugador no encontrado");
      return response.json();
    })
    .then((account) => {
      // Estado paginación
      currentPuuid = account.puuid;
      currentStart = 0;

      // UI perfil (sin PUUID visible)
      profileName.textContent = `${account.gameName}#${account.tagLine}`;
      profileSub.textContent = "Perfil cargado";

      // Rank
      if (rankInfo) {
        fetch(`/api/rank?puuid=${encodeURIComponent(account.puuid)}`)
          .then((r) => r.json())
          .then((entries) => {
            const solo = entries.find((e) => e.queueType === "RANKED_SOLO_5x5");
            if (!solo) {
              rankInfo.innerHTML = `<div class="small">Sin clasificar</div>`;
              return;
            }
            const winrate = ((solo.wins / (solo.wins + solo.losses)) * 100).toFixed(1);

            rankInfo.innerHTML = `
              <div><strong>${solo.tier} ${solo.rank}</strong> (${solo.leaguePoints} LP)</div>
              <div class="small">${solo.wins}W / ${solo.losses}L</div>
              <div class="small">Winrate: ${winrate}%</div>
            `;
          })
          .catch(() => {
            rankInfo.innerHTML = `<div class="small">No disponible</div>`;
          });
      }

      // Icono + nivel
      const ddragonVersion = "13.24.1";
      fetch(`/api/summoner-info?puuid=${encodeURIComponent(account.puuid)}`)
        .then((r) => {
          if (!r.ok) throw new Error("No se pudo cargar summoner-info");
          return r.json();
        })
        .then((info) => {
          if (profileIcon) {
            profileIcon.src = `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/profileicon/${info.profileIconId}.png`;
          }
          if (profileLevel) profileLevel.textContent = info.summonerLevel;
        })
        .catch((err) => {
          console.error(err);
          if (profileLevel) profileLevel.textContent = "";
        });

      // Limpiar resultados + mostrar botón
      resultsDiv.innerHTML = "";
      if (loadMoreBtn) {
        loadMoreBtn.classList.remove("hidden");
        loadMoreBtn.disabled = false;
        loadMoreBtn.textContent = "Cargar más";
      }

      // Primera página (20)
      return fetch(
        `/api/match-summaries?puuid=${encodeURIComponent(currentPuuid)}&count=${pageSize}&start=${currentStart}`
      );
    })
    .then((response) => {
      if (!response.ok) throw new Error("No se pudieron cargar las partidas");
      return response.json();
    })
    .then((summaries) => {
      appendMatchCards(summaries);
      currentStart += summaries.length;

      if (loadMoreBtn && (!summaries || summaries.length < pageSize)) {
        loadMoreBtn.classList.add("hidden");
      }
    })
    .catch((error) => {
      profileSub.textContent = "Error al cargar el perfil";
      resultsDiv.innerHTML = `<p style="color:red;">Error: ${error.message}</p>`;
      console.error(error);
    });
});

// Soporte: abrir directo /summoner/.. y back/forward
window.addEventListener("DOMContentLoaded", () => {
  const parsed = parseSummonerPath(window.location.pathname);
  if (parsed) {
    riotIdInput.value = `${parsed.gameName}#${parsed.tagLine}`;
    form.requestSubmit();
  }
});

window.addEventListener("popstate", () => {
  const parsed = parseSummonerPath(window.location.pathname);

  if (!parsed) {
    showHomeView();
    return;
  }

  riotIdInput.value = `${parsed.gameName}#${parsed.tagLine}`;
  form.requestSubmit();
});