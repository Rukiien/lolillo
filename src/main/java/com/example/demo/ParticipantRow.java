package com.example.demo;

import java.util.List;

public class ParticipantRow {
    private int teamId;
    private String riotId;
    private String championName;
    private int champLevel;

    private int kills;
    private int deaths;
    private int assists;

    private int cs;
    private int damageToChamps;
    private int goldEarned;

    private List<Integer> items;
    // getters/setters
    public int getTeamId() { return teamId; }
    public void setTeamId(int teamId) { this.teamId = teamId; }

    public String getRiotId() { return riotId; }
    public void setRiotId(String riotId) { this.riotId = riotId; }

    public String getChampionName() { return championName; }
    public void setChampionName(String championName) { this.championName = championName; }

    public int getChampLevel() { return champLevel; }
    public void setChampLevel(int champLevel) { this.champLevel = champLevel; }

    public int getKills() { return kills; }
    public void setKills(int kills) { this.kills = kills; }

    public int getDeaths() { return deaths; }
    public void setDeaths(int deaths) { this.deaths = deaths; }

    public int getAssists() { return assists; }
    public void setAssists(int assists) { this.assists = assists; }

    public int getCs() { return cs; }
    public void setCs(int cs) { this.cs = cs; }

    public int getDamageToChamps() { return damageToChamps; }
    public void setDamageToChamps(int damageToChamps) { this.damageToChamps = damageToChamps; }

    public int getGoldEarned() { return goldEarned; }
    public void setGoldEarned(int goldEarned) { this.goldEarned = goldEarned; }

    public List<Integer> getItems() { return items; }
    public void setItems(List<Integer> items) { this.items = items; }
}
