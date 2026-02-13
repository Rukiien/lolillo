package com.example.demo;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

import java.util.List;

@RestController
@RequestMapping("/api")
public class SearchController {

    private final RiotService riotService;

    public SearchController(RiotService riotService) {
        this.riotService = riotService;
    }

    @GetMapping("/resolve")
    public ResponseEntity<?> resolve(
            @RequestParam String gameName,
            @RequestParam String tagLine
    ) {

        RiotAccount account = riotService.getAccountByRiotId(gameName, tagLine);

        if (account == null) {
            return ResponseEntity
                    .status(404)
                    .body("Jugador no encontrado");
        }

        return ResponseEntity.ok(account);
    }

    @GetMapping("/matches")
    public List<String> matches(@RequestParam String puuid) {
        return riotService.getMatchIdsByPuuid(puuid);
    }

    @GetMapping("/match")
    public String match(@RequestParam String matchId) {
        return riotService.getMatchDetails(matchId);
    }

    @GetMapping("/match-summaries")
    public ResponseEntity<?> matchSummaries(
            @RequestParam String puuid,
            @RequestParam(defaultValue = "20") int count,
            @RequestParam(defaultValue = "0") int start
    ) {
        try {
            int safeCount = Math.min(Math.max(count, 1), 20); // 20 por página
            int safeStart = Math.max(start, 0);

            List<MatchSummary> data = riotService.getMatchSummariesByPuuid(puuid, safeCount, safeStart);
            return ResponseEntity.ok(data);
        } catch (Exception e) {
            return ResponseEntity.status(502).body("Error llamando a Riot: " + e.getMessage());
        }
    }


    @GetMapping("/match-details")
    public MatchDetails matchDetails(@RequestParam String matchId) {
        return riotService.getMatchDetailsLite(matchId);
    }

    @GetMapping("/summoner-info")
    public SummonerInfo summonerInfo(@RequestParam String puuid) {
        return riotService.getSummonerInfoByPuuid(puuid);
    }

    @GetMapping("/rank")
    public ResponseEntity<?> rank(@RequestParam String puuid) {
        try {
            return ResponseEntity.ok(riotService.getRankByPuuid(puuid));
        } catch (Exception e) {
            e.printStackTrace(); // para que salga el error en consola
            return ResponseEntity.status(500).body("Rank endpoint error: " + e.getMessage());
        }
    }

}
