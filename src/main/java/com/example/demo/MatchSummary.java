package com.example.demo;

public class MatchSummary {
    private String matchId;
    private String championName;
    private int kills;
    private int deaths;
    private int assists;
    private boolean win;
    private int gameDurationSeconds;
    private int item0;
    private int item1;
    private int item2;
    private int item3;
    private int item4;
    private int item5;
    private int item6;
    private int roleBoundItem;
    private String position;
    private int totalMinionsKilled;
    private int neutralMinionsKilled;
    private int goldEarned;




    public MatchSummary() {}

    public MatchSummary(String matchId, String championName, int kills, int deaths, int assists, boolean win, int gameDurationSeconds) {
        this.matchId = matchId;
        this.championName = championName;
        this.kills = kills;
        this.deaths = deaths;
        this.assists = assists;
        this.win = win;
        this.gameDurationSeconds = gameDurationSeconds;
    }

    public String getMatchId() { return matchId; }
    public void setMatchId(String matchId) { this.matchId = matchId; }

    public String getChampionName() { return championName; }
    public void setChampionName(String championName) { this.championName = championName; }

    public int getKills() { return kills; }
    public void setKills(int kills) { this.kills = kills; }

    public int getDeaths() { return deaths; }
    public void setDeaths(int deaths) { this.deaths = deaths; }

    public int getAssists() { return assists; }
    public void setAssists(int assists) { this.assists = assists; }

    public boolean isWin() { return win; }
    public void setWin(boolean win) { this.win = win; }

    public int getGameDurationSeconds() { return gameDurationSeconds; }
    public void setGameDurationSeconds(int gameDurationSeconds) { this.gameDurationSeconds = gameDurationSeconds; }

    public int getItem0() {
        return item0;
    }

    public void setItem0(int item0) {
        this.item0 = item0;
    }

    public int getItem1() {
        return item1;
    }

    public void setItem1(int item1) {
        this.item1 = item1;
    }

    public int getItem2() {
        return item2;
    }

    public void setItem2(int item2) {
        this.item2 = item2;
    }

    public int getItem3() {
        return item3;
    }

    public void setItem3(int item3) {
        this.item3 = item3;
    }

    public int getItem4() {
        return item4;
    }

    public void setItem4(int item4) {
        this.item4 = item4;
    }

    public int getItem5() {
        return item5;
    }

    public void setItem5(int item5) {
        this.item5 = item5;
    }

    public int getItem6() {
        return item6;
    }

    public void setItem6(int item6) {
        this.item6 = item6;
    }

    public int getRoleBoundItem() {
        return roleBoundItem;
    }

    public void setRoleBoundItem(int roleBoundItem) {
        this.roleBoundItem = roleBoundItem;
    }
    public String getPosition() {
        return position;
    }

    public void setPosition(String position) {
        this.position = position;
    }
    public int getTotalMinionsKilled() {
        return totalMinionsKilled;
    }

    public void setTotalMinionsKilled(int totalMinionsKilled) {
        this.totalMinionsKilled = totalMinionsKilled;
    }

    public int getNeutralMinionsKilled() {
        return neutralMinionsKilled;
    }

    public void setNeutralMinionsKilled(int neutralMinionsKilled) {
        this.neutralMinionsKilled = neutralMinionsKilled;
    }

    public int getGoldEarned() {
        return goldEarned;
    }

    public void setGoldEarned(int goldEarned) {
        this.goldEarned = goldEarned;
    }


}
