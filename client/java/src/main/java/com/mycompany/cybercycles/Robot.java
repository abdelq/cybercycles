package com.mycompany.cybercycles;

public class Robot {
    
    public static final String channel = "NOOOOOOOOOON";
    public static final String team = null;
    
    public void start(Player[] players, Obstacle[] obstacles, int w, int h, int myId) {
        System.out.println(players[0].id + " : " + obstacles[0].x + " " + w + " " + h + " " + myId);
    }
    
    public char nextMove(Move[] moves) {
        for(int i=0; i<moves.length; i++) {
            System.out.println("Player " + moves[i].playerId + " moved to : " + Character.toString(moves[i].direction));
        }
        
        return 'r';
    }
}
