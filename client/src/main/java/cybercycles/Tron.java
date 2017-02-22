package cybercycles;

import java.net.URISyntaxException;
import io.socket.client.IO;
import io.socket.client.Socket;
import io.socket.emitter.Emitter;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.json.JSONObject;
import org.json.JSONArray;
import org.json.JSONException;

/**
 */
public class Tron {
    public static void main (String[] args) throws URISyntaxException {

        boolean overwrite = args.length == 3;

        final String server = overwrite ? args[0] : "http://kekstarter.org:1337";

        final AI ai = new AI();

        final String room = overwrite ? args[1] : ai.ROOM;
        final String team = overwrite ? args[2] : ai.TEAM;

        final Socket socket = IO.socket(server);

        socket.on(Socket.EVENT_CONNECT, new Emitter.Listener() {

            @Override
            public void call(Object... args) {
                if (!room.isEmpty()) {
                    socket.emit("join", room, team);
                    System.out.println("Lien vers le match : " + server + "/" + room);
                } else {
                    System.out.println("Veuillez choisir un nom pour votre chambre");
                    System.exit(0);
                }
            }

        }).on("start", new Emitter.Listener() {

            @Override
            public void call(Object... args) {
                JSONObject config = (JSONObject) args[0];

                try {
                    ai.start(config);
                } catch (JSONException ex) {
                    Logger.getLogger(Tron.class.getName()).log(Level.SEVERE, null, ex);
                }
            }

        }).on("next", new Emitter.Listener() {

            @Override
            public void call(Object... args) {
                JSONArray prevMoves = (JSONArray) args[0];
                socket.emit("move", ai.next(prevMoves));
            }

        }).on("end", new Emitter.Listener() {

            @Override
            public void call(Object... args) {
                String winnerID = (String) args[0];
                ai.end(winnerID);

                System.out.println("winnerID : " + winnerID);
                System.exit(0);
            }

        }).on(Socket.EVENT_DISCONNECT, new Emitter.Listener() {

            @Override
            public void call(Object... args) {
                System.out.println("Vous avez été déconnecté");
                System.exit(0);
            }

        });

        socket.connect();
    }
}
