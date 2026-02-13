package com.example.demo;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class RiotService {
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RiotConfig riotConfig;
    private final WebClient webClient;

    public RiotService(RiotConfig riotConfig) {
        this.riotConfig = riotConfig;
        this.webClient = WebClient.builder()
                .baseUrl("https://europe.api.riotgames.com")
                .build();
    }

    public RiotAccount getAccountByRiotId(String gameName, String tagLine) {

        try {
            return webClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine}")
                            .queryParam("api_key", riotConfig.getApiKey())
                            .build(gameName, tagLine))
                    .retrieve()
                    .bodyToMono(RiotAccount.class)
                    .block();

        } catch (Exception e) {
            return null;
        }
    }
    public List<String> getMatchIdsByPuuid(String puuid) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/lol/match/v5/matches/by-puuid/{puuid}/ids")
                        .queryParam("start", 0)
                        .queryParam("count", 5)
                        .queryParam("api_key", riotConfig.getApiKey())
                        .build(puuid))
                .retrieve()
                .bodyToFlux(String.class)
                .collectList()
                .block();
    }
    public String getMatchDetails(String matchId) {

        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/lol/match/v5/matches/{matchId}")
                        .queryParam("api_key", riotConfig.getApiKey())
                        .build(matchId))
                .retrieve()
                .bodyToMono(String.class)
                .block();
    }
    public List<MatchSummary> getMatchSummariesByPuuid(String puuid, int count, int start) {

        String[] matchIdsArray = webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/lol/match/v5/matches/by-puuid/{puuid}/ids")
                        .queryParam("start", start)
                        .queryParam("count", count)
                        .queryParam("start", 0)
                        .queryParam("count", count)
                        .queryParam("api_key", riotConfig.getApiKey())
                        .build(puuid))
                .retrieve()
                .bodyToMono(String[].class)
                .block();

        List<String> matchIds = matchIdsArray == null
                ? Collections.emptyList()
                : Arrays.asList(matchIdsArray);

        List<MatchSummary> summaries = new java.util.ArrayList<>();

        for (String matchId : matchIds) {
            try {
                String rawMatchJson = webClient.get()
                        .uri(uriBuilder -> uriBuilder
                                .path("/lol/match/v5/matches/{matchId}")
                                .queryParam("api_key", riotConfig.getApiKey())
                                .build(matchId))
                        .retrieve()
                        .bodyToMono(String.class)
                        .block();

                if (rawMatchJson == null) continue;

                summaries.add(extractSummary(rawMatchJson, matchId, puuid));
            } catch (Exception ignored) {
                // Si falla una partida, no rompemos todo el endpoint
            }
        }

        return summaries;
    }

    private MatchSummary extractSummary(String rawMatchJson, String matchId, String puuid) throws Exception {
        JsonNode root = objectMapper.readTree(rawMatchJson);

        JsonNode info = root.get("info");
        int gameDuration = info.get("gameDuration").asInt();

        JsonNode participants = info.get("participants");

        JsonNode me = null;
        for (JsonNode p : participants) {
            String pPuuid = p.get("puuid").asText();
            if (puuid.equals(pPuuid)) {
                me = p;
                break;
            }
        }

        if (me == null) {
            throw new IllegalStateException("No se encontró participante para el puuid en " + matchId);
        }

        String championName = me.get("championName").asText();
        int kills = me.get("kills").asInt();
        int deaths = me.get("deaths").asInt();
        int assists = me.get("assists").asInt();
        boolean win = me.get("win").asBoolean();
        String position = me.has("teamPosition") ? me.get("teamPosition").asText() : "";
        if (position == null) position = "";
        if (position.isBlank() && me.has("individualPosition")) {
            position = me.get("individualPosition").asText();
        }



        int item0 = me.get("item0").asInt();
        int item1 = me.get("item1").asInt();
        int item2 = me.get("item2").asInt();
        int item3 = me.get("item3").asInt();
        int item4 = me.get("item4").asInt();
        int item5 = me.get("item5").asInt();
        int item6 = me.get("item6").asInt();
        int totalMinionsKilled = me.get("totalMinionsKilled").asInt();
        int neutralMinionsKilled = me.get("neutralMinionsKilled").asInt();
        int goldEarned = me.get("goldEarned").asInt();

        int roleBoundItem = me.has("roleBoundItem") ? me.get("roleBoundItem").asInt() : 0;

        MatchSummary summary = new MatchSummary(
                matchId,
                championName,
                kills,
                deaths,
                assists,
                win,
                gameDuration
        );

        summary.setItem0(item0);
        summary.setItem1(item1);
        summary.setItem2(item2);
        summary.setItem3(item3);
        summary.setItem4(item4);
        summary.setItem5(item5);
        summary.setItem6(item6);

        summary.setRoleBoundItem(roleBoundItem);
        summary.setPosition(position);

        summary.setTotalMinionsKilled(totalMinionsKilled);
        summary.setNeutralMinionsKilled(neutralMinionsKilled);
        summary.setGoldEarned(goldEarned);

        return summary;

    }

    public MatchDetails getMatchDetailsLite(String matchId) {
        String raw = webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/lol/match/v5/matches/{matchId}")
                        .queryParam("api_key", riotConfig.getApiKey())
                        .build(matchId))
                .retrieve()
                .bodyToMono(String.class)
                .block();

        if (raw == null) {
            throw new IllegalStateException("Match vacío: " + matchId);
        }

        try {
            JsonNode root = objectMapper.readTree(raw);
            JsonNode info = root.get("info");
            JsonNode participants = info.get("participants");

            List<ParticipantRow> blue = new ArrayList<>();
            List<ParticipantRow> red = new ArrayList<>();

            for (JsonNode p : participants) {
                ParticipantRow row = new ParticipantRow();

                int teamId = p.get("teamId").asInt(); // 100 o 200
                row.setTeamId(teamId);

                // Riot ID: a veces viene separado
                String g = p.has("riotIdGameName") ? p.get("riotIdGameName").asText() : "";
                String t = p.has("riotIdTagline") ? p.get("riotIdTagline").asText() : "";
                String riotId = (!g.isBlank() && !t.isBlank()) ? (g + "#" + t) : g;
                row.setRiotId(riotId);

                row.setChampionName(p.get("championName").asText());
                row.setChampLevel(p.get("champLevel").asInt());

                row.setKills(p.get("kills").asInt());
                row.setDeaths(p.get("deaths").asInt());
                row.setAssists(p.get("assists").asInt());

                int cs = p.get("totalMinionsKilled").asInt() + p.get("neutralMinionsKilled").asInt();
                row.setCs(cs);

                row.setDamageToChamps(p.get("totalDamageDealtToChampions").asInt());
                row.setGoldEarned(p.get("goldEarned").asInt());

                // items: item0..item6 + roleBoundItem si existe
                List<Integer> items = new ArrayList<>();
                items.add(p.get("item0").asInt());
                items.add(p.get("item1").asInt());
                items.add(p.get("item2").asInt());
                items.add(p.get("item3").asInt());
                items.add(p.get("item4").asInt());
                items.add(p.get("item5").asInt());
                items.add(p.get("item6").asInt());

                if (p.has("roleBoundItem")) {
                    int roleBoundItem = p.get("roleBoundItem").asInt();
                    if (roleBoundItem != 0) items.add(roleBoundItem);
                }

                // quitamos ceros (slots vacíos)
                items.removeIf(id -> id == 0);
                row.setItems(items);

                if (teamId == 100) blue.add(row);
                else red.add(row);
            }

            MatchDetails details = new MatchDetails();
            details.setMatchId(matchId);

            // Saber si gana blue: en Riot viene por participant.win (todos iguales dentro del equipo)
            boolean blueWin = !blue.isEmpty() && info.get("participants").get(0) != null
                    ? blue.get(0).getTeamId() == 100 && root.get("info").get("participants") != null
                    : false;

            // Forma más fiable: tomar el primer jugador del equipo blue y leer su "win"
            // (para eso necesitamos leer win del JSON; lo hacemos aquí mismo sin añadirlo al DTO)
            // Recalculamos:
            boolean computedBlueWin = false;
            for (JsonNode p : participants) {
                if (p.get("teamId").asInt() == 100) {
                    computedBlueWin = p.get("win").asBoolean();
                    break;
                }
            }
            details.setBlueWin(computedBlueWin);

            details.setBlue(blue);
            details.setRed(red);

            return details;
        } catch (Exception e) {
            throw new RuntimeException("No se pudo parsear match: " + matchId, e);
        }
    }

    public SummonerInfo getSummonerInfoByPuuid(String puuid) {
        String url = "https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/" + puuid
                + "?api_key=" + riotConfig.getApiKey();

        String raw = webClient.get()
                .uri(url)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        if (raw == null) throw new IllegalStateException("Summoner vacío para puuid " + puuid);

        try {
            JsonNode root = objectMapper.readTree(raw);

            SummonerInfo info = new SummonerInfo();
            info.setProfileIconId(root.get("profileIconId").asInt());
            info.setSummonerLevel(root.get("summonerLevel").asInt());
            return info;
        } catch (Exception e) {
            throw new RuntimeException("No se pudo parsear summoner info", e);
        }
    }
    public List<LeagueEntry> getRankByPuuid(String puuid) {

        String url = "https://euw1.api.riotgames.com/lol/league/v4/entries/by-puuid/"
                + puuid + "?api_key=" + riotConfig.getApiKey();

        String raw = webClient.get()
                .uri(url)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        try {
            return objectMapper.readValue(raw,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, LeagueEntry.class));
        } catch (Exception e) {
            throw new RuntimeException("Error parseando rank", e);
        }
    }

}
