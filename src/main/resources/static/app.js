
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


let currentPuuid = null;
let currentStart = 0;
const pageSize = 10;

const ddragonVersion = "13.24.1";

function showHomeView() {
  viewProfile.classList.add("hidden");
  viewHome.classList.remove("hidden");
}

function showProfileView() {
  viewHome.classList.add("hidden");
  viewProfile.classList.remove("hidden");
}

function parseRiotId(input) {
  const s = (input || "").trim();
  const parts = s.split("#");
  const gameName = parts[0]?.trim();
  const tagLine = parts[1]?.trim();
  if (!gameName || !tagLine) return null;
  return { gameName, tagLine };
}

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

async function fetchJsonOrThrow(url) {
  const r = await fetch(url);
  const text = await r.text();

  if (!r.ok) throw new Error(text || `HTTP ${r.status}`);
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(text);
  }
}

function champIconUrl(championKey) {
  return `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/champion/${encodeURIComponent(
    championKey
  )}.png`;
}
function spellIconUrl(spellKey) {
  return `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/spell/${encodeURIComponent(spellKey)}.png`;
}
function itemIconUrl(itemId) {
  return `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/item/${itemId}.png`;
}
function rankEmblemUrl(tier) {
  if (!tier) return null;
  const t = String(tier).toLowerCase();
  return `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-emblem/emblem-${t}.png`;
}

function formatDuration(seconds) {
  const s = Math.max(0, Number(seconds || 0));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function kdaRatio(k, d, a) {
  const den = d === 0 ? 1 : d;
  return ((k + a) / den).toFixed(2);
}

function toValidItemId(id) {
  const n = Number(id);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function renderRank(entries) {
  const solo = Array.isArray(entries)
    ? entries.find((e) => e.queueType === "RANKED_SOLO_5x5")
    : null;

  if (!solo) {
    rankInfo.innerHTML = `<div class="small">Sin clasificar</div>`;
    return;
  }

  const wins = Number(solo.wins || 0);
  const losses = Number(solo.losses || 0);
  const total = wins + losses;
  const winrate = total > 0 ? ((wins / total) * 100).toFixed(1) : "0.0";

  const imgUrl = rankEmblemUrl(solo.tier);

  rankInfo.innerHTML = `
    <div class="rank-card">
      ${imgUrl ? `<img class="rank-emblem" src="${imgUrl}" alt="${solo.tier}" />` : ""}
      <div class="rank-text">
        <div class="rank-title">
          ${solo.tier} ${solo.rank}
          <span class="rank-lp">(${solo.leaguePoints} LP)</span>
        </div>
        <div class="rank-line"><b>${wins}W</b> / ${losses}L</div>
        <div class="rank-line">Winrate: <b>${winrate}%</b></div>
      </div>
    </div>
  `;
}

function renderItemsRowFromMatch(m) {
  const ids = [
    m.item0,
    m.item1,
    m.item2,
    m.item3,
    m.item4,
    m.item5,
    m.item6,
  ]
    .map((x) => toValidItemId(x))
    .filter((x) => x !== null);

  if (ids.length === 0) return `<div class="items-row small">Sin items</div>`;

  return `
    <div class="items-row">
      ${ids
        .map(
          (id) =>
            `<img class="item-icon" src="${itemIconUrl(id)}" alt="${id}" onerror="this.style.display='none'">`
        )
        .join("")}
    </div>
  `;
}

function renderMatchCard(m) {
  const win = !!m.win;
  const resultText = win ? "VICTORIA" : "DERROTA";

  const durText = formatDuration(m.gameDurationSeconds || 0);

  const cs = (m.totalMinionsKilled || 0) + (m.neutralMinionsKilled || 0);
  const minutes = (m.gameDurationSeconds || 0) / 60;
  const cspm = minutes > 0 ? (cs / minutes).toFixed(1) : "0.0";

  const kdaText = `${m.kills}/${m.deaths}/${m.assists}`;
  const ratio = kdaRatio(m.kills || 0, m.deaths || 0, m.assists || 0);

  const champImg = champIconUrl(m.championName);
  const spell1Img = m.spell1 ? spellIconUrl(m.spell1) : "";
  const spell2Img = m.spell2 ? spellIconUrl(m.spell2) : "";

  return `
    <article class="match-card ${win ? "win" : "lose"}" data-matchid="${m.matchId}">
      <div class="match-left">
        <div class="champ-stack">
          <img class="champ-icon" src="${champImg}" alt="${m.championName}" onerror="this.style.display='none'">
          <div class="spell-stack">
            ${spell1Img ? `<img class="spell-icon" src="${spell1Img}" alt="S1" onerror="this.style.display='none'">` : ""}
            ${spell2Img ? `<img class="spell-icon" src="${spell2Img}" alt="S2" onerror="this.style.display='none'">` : ""}
          </div>
        </div>

        <div class="match-main">
          <div class="match-toprow">
            <div class="match-title">${resultText}</div>
            <div class="match-meta small">Duración ${durText}</div>
          </div>

          <div class="match-midrow">
            <div class="match-champname">${m.championName}</div>
            <div class="match-role small">${m.position || ""}</div>
          </div>

          <div class="match-stats">
            <div class="match-kda">
              <b>${kdaText}</b> <span class="small">(${ratio} KDA)</span>
            </div>
            <div class="small">${cs} CS (${cspm}/min) · ${(Number(m.goldEarned || 0) / 1000).toFixed(1)}k gold</div>
          </div>

          ${renderItemsRowFromMatch(m)}
        </div>
      </div>

      <!-- Click en toda la card para desplegar -->
      <div class="match-details hidden"></div>
    </article>
  `;
}

function renderPlayerRow(p, maxDmg) {
  const champImg = champIconUrl(p.championName);

  const kdaText = `${p.kills}/${p.deaths}/${p.assists}`;
  const ratio = kdaRatio(p.kills || 0, p.deaths || 0, p.assists || 0);

  const cs = Number(p.cs ?? 0);
  const dmg = Number(p.damageToChamps ?? 0);
  const dmgPct = maxDmg > 0 ? Math.round((dmg / maxDmg) * 100) : 0;

  const items = (p.items || [])
    .map(toValidItemId)
    .filter((x) => x !== null);

  const itemsHtml = items
    .map((id) => `<img class="item-icon" src="${itemIconUrl(id)}" alt="${id}" onerror="this.style.display='none'">`)
    .join("");

  return `
    <tr>
      <td class="p-cell">
        <img class="champ-mini" src="${champImg}" alt="${p.championName}" onerror="this.style.display='none'">
        <div class="p-text">
          <div class="p-name">${p.riotId || p.summonerName || "—"}</div>
          <div class="small">${p.position || ""}</div>
        </div>
      </td>

      <td>
        <div class="p-kda">${kdaText}</div>
        <div class="small">${ratio} KDA</div>
      </td>

      <td>
        <div class="bar-wrap"><div class="bar" style="width:${dmgPct}%"></div></div>
        <div class="small">${dmg.toLocaleString()}</div>
      </td>

      <td>${cs}</td>

      <td class="p-items">${itemsHtml || `<span class="small">—</span>`}</td>
    </tr>
  `;
}

function renderTeamTable(team, title, win, maxDmg) {
  return `
    <div class="team-block">
      <div class="team-header ${win ? "win" : "lose"}">
        <span>${title}</span>
        <span class="small">${win ? "Win" : "Lose"}</span>
      </div>

      <table class="details-table">
        <thead>
          <tr>
            <th>Jugador</th>
            <th>KDA</th>
            <th>Daño</th>
            <th>CS</th>
            <th>Items</th>
          </tr>
        </thead>
        <tbody>
          ${team.map((p) => renderPlayerRow(p, maxDmg)).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderMatchDetailsTable(details) {
  // Esperamos: details.blue[], details.red[], details.blueWin boolean
  const blue = details?.blue || [];
  const red = details?.red || [];

  const blueMax = Math.max(1, ...blue.map((p) => Number(p.damageToChamps || 0)));
  const redMax = Math.max(1, ...red.map((p) => Number(p.damageToChamps || 0)));

  const blueHtml = renderTeamTable(blue, "Blue Team", !!details.blueWin, blueMax);
  const redHtml = renderTeamTable(red, "Red Team", !details.blueWin, redMax);

  return `<div class="details-wrap">${blueHtml}${redHtml}</div>`;
}

function appendMatches(summaries) {
  if (!Array.isArray(summaries) || summaries.length === 0) return;

  resultsDiv.insertAdjacentHTML("beforeend", summaries.map(renderMatchCard).join(""));

  const cards = resultsDiv.querySelectorAll(".match-card:not([data-wired='true'])");
  cards.forEach((card) => {
    card.dataset.wired = "true";

    const details = card.querySelector(".match-details");
    const matchId = card.dataset.matchid;

    card.addEventListener("click", async () => {
      const isHidden = details.classList.contains("hidden");

      if (!isHidden) {
        details.classList.add("hidden");
        return;
      }

      details.classList.remove("hidden");

      if (card.dataset.loaded === "true") return;

      details.innerHTML = `<div class="small">Cargando detalles...</div>`;

      try {
        const data = await fetchJsonOrThrow(`/api/match-details?matchId=${encodeURIComponent(matchId)}`);
        details.innerHTML = renderMatchDetailsTable(data);
        card.dataset.loaded = "true";
      } catch (err) {
        details.innerHTML = `<div class="small">No se pudieron cargar detalles.</div>`;
        console.error(err);
      }
    });
  });
}

async function loadProfile(gameName, tagLine) {
  showProfileView();

  resultsDiv.innerHTML = "";
  loadMoreBtn.classList.add("hidden");
  rankInfo.innerHTML = `<div class="small">Cargando...</div>`;

  profileName.textContent = `${gameName}#${tagLine}`;
  profileSub.textContent = "Cargando perfil...";
  profileIcon.removeAttribute("src");
  profileLevel.textContent = "";

  const account = await fetchJsonOrThrow(
    `/api/resolve?gameName=${encodeURIComponent(gameName)}&tagLine=${encodeURIComponent(tagLine)}`
  );

  currentPuuid = account.puuid;
  currentStart = 0;

  profileName.textContent = `${account.gameName}#${account.tagLine}`;
  profileSub.textContent = ""; // sin PUUID

  try {
    const info = await fetchJsonOrThrow(`/api/summoner-info?puuid=${encodeURIComponent(account.puuid)}`);
    profileIcon.src = `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/profileicon/${info.profileIconId}.png`;
    profileLevel.textContent = info.summonerLevel;
  } catch (e) {
    console.error("summoner-info:", e);
  }

  try {
    const entries = await fetchJsonOrThrow(`/api/rank?puuid=${encodeURIComponent(account.puuid)}`);
    renderRank(entries);
  } catch (e) {
    console.error("rank:", e);
    rankInfo.innerHTML = `<div class="small">No disponible</div>`;
  }

  await loadMoreMatches();
}

async function loadMoreMatches() {
  if (!currentPuuid) return;

  loadMoreBtn.classList.add("hidden");
  loadMoreBtn.disabled = true;

  const summaries = await fetchJsonOrThrow(
    `/api/match-summaries?puuid=${encodeURIComponent(currentPuuid)}&start=${currentStart}&count=${pageSize}`
  );

  appendMatches(summaries);

  currentStart += summaries?.length || 0;

  if (summaries && summaries.length === pageSize) {
    loadMoreBtn.classList.remove("hidden");
    loadMoreBtn.disabled = false;
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const parsed = parseRiotId(riotIdInput.value);
  if (!parsed) return alert('Formato correcto: "Nombre#TAG"');

  const { gameName, tagLine } = parsed;

  history.pushState({}, "", buildSummonerPath(gameName, tagLine));

  loadProfile(gameName, tagLine).catch((err) => {
    console.error(err);
    profileSub.textContent = err.message || "Error";
  });
});

searchIcon.addEventListener("click", () => form.requestSubmit());

backBtn.addEventListener("click", () => {
  history.pushState({}, "", "/");
  showHomeView();
});

loadMoreBtn.addEventListener("click", () => {
  loadMoreMatches().catch(console.error);
});


window.addEventListener("DOMContentLoaded", () => {
  const parsed = parseSummonerPath(window.location.pathname);
  if (parsed) {
    riotIdInput.value = `${parsed.gameName}#${parsed.tagLine}`;
    loadProfile(parsed.gameName, parsed.tagLine).catch(console.error);
  } else {
    showHomeView();
  }
});

window.addEventListener("popstate", () => {
  const parsed = parseSummonerPath(window.location.pathname);
  if (parsed) {
    riotIdInput.value = `${parsed.gameName}#${parsed.tagLine}`;
    loadProfile(parsed.gameName, parsed.tagLine).catch(console.error);
  } else {
    showHomeView();
  }
});
const brandLink = document.getElementById("brandLink");

if (brandLink) {
  brandLink.addEventListener("click", (e) => {
    e.preventDefault();
    history.pushState({}, "", "/");
    showHomeView();
  });
}
const historyTab = document.getElementById("historyTab");

if (historyTab) {
  historyTab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    historyTab.classList.add("active");

    showProfileView();
  });
}

