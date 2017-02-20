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

public class Tron {
    public static void main (String[] args) throws URISyntaxException {
        final Socket socket = IO.socket("http://localhost:1337");
        final AI ai = new AI();

        socket.on(Socket.EVENT_CONNECT, new Emitter.Listener() {

            @Override
            public void call(Object... args) {
                if (!ai.ROOM.isEmpty()) {
                    socket.emit("join", ai.ROOM, ai.TEAM);
                    System.out.println("Lien vers le match : http://localhost:1337/" + ai.ROOM);
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
