package com.mycompany.cybercycles;

import io.socket.client.IO;
import io.socket.client.Socket;
import io.socket.emitter.Emitter;
import java.net.URISyntaxException;
import org.json.JSONArray;
import org.json.JSONObject;

public class Main {

    public static void main(String[] argv) throws URISyntaxException {
        Socket s = IO.socket("http://localhost:1337");

        Robot robbie = new Robot();

        s.on(Socket.EVENT_CONNECT, new Emitter.Listener() {
            @Override
            public void call(Object... args) {
                System.out.println("Connected");
            }
        }).on("start", new Emitter.Listener() {
            @Override
            public void call(Object... args) {
                JSONObject object = (JSONObject) args[0];

                try {
                    JSONArray json_players = object.getJSONArray("players");

                    Player[] players = new Player[json_players.length()];

                    for (int i = 0; i < json_players.length(); i++) {
                        JSONObject p = json_players.getJSONObject(i);
                        players[i] = new Player(
                                p.getInt("x"),
                                p.getInt("y"),
                                p.getInt("id"),
                                p.getInt("team")
                        );
                    }

                    JSONArray json_obstacles = object.getJSONArray("obstacles");
                    Obstacle[] obstacles = new Obstacle[json_obstacles.length()];

                    for (int i = 0; i < json_obstacles.length(); i++) {
                        JSONObject o = json_obstacles.getJSONObject(i);
                        obstacles[i] = new Obstacle(
                                o.getInt("x"), o.getInt("y"),
                                o.getInt("w"), o.getInt("h")
                        );
                    }

                    robbie.start(
                            players, obstacles,
                            object.getInt("w"), object.getInt("h"),
                            object.getInt("me")
                    );

                } catch (Exception e) {
                    // Poké-catch : gotta catch'em all !
                }
            }
        }).on("nextMove", new Emitter.Listener() {
            @Override
            public void call(Object... args) {
                try {
                JSONArray json_moves = (JSONArray) args[0];

                Move[] moves = new Move[json_moves.length()];

                for(int i=0; i<json_moves.length(); i++) {
                    JSONObject m = json_moves.getJSONObject(i);
                    moves[i] = new Move(m.getInt("id"), m.getString("direction").charAt(0));
                }
                
                char direction = robbie.nextMove(moves);

                s.emit("move", direction);
                } catch(Exception e) {
                    // Poké-catch : gotta catch'em all !
                }
            }
        }).on("end", new Emitter.Listener() {
            @Override
            public void call(Object... args) {
                System.out.println("Ending");
                s.disconnect();
            }
        }).on(Socket.EVENT_DISCONNECT, new Emitter.Listener() {
            @Override
            public void call(Object... args) {
                System.out.println("Disconnected");
                System.exit(0);
            }
        });

        s.connect();
        s.emit("join", Robot.channel, Robot.team);
    }
}
