package com.example.demo;

import java.util.List;

public class MatchDetails {
    private String matchId;
    private boolean blueWin;
    private List<ParticipantRow> blue;
    private List<ParticipantRow> red;

    public String getMatchId() { return matchId; }
    public void setMatchId(String matchId) { this.matchId = matchId; }

    public boolean isBlueWin() { return blueWin; }
    public void setBlueWin(boolean blueWin) { this.blueWin = blueWin; }

    public List<ParticipantRow> getBlue() { return blue; }
    public void setBlue(List<ParticipantRow> blue) { this.blue = blue; }

    public List<ParticipantRow> getRed() { return red; }
    public void setRed(List<ParticipantRow> red) { this.red = red; }
}