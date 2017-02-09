package cybercycles;

import io.socket.client.IO;
import io.socket.client.Socket;
import io.socket.emitter.Emitter;
import org.json.JSONObject;
import org.json.JSONArray;
import java.net.URISyntaxException;

public class Tron {
  public static void main (String[] args) throws URISyntaxException {
    final Socket socket = IO.socket("http://localhost:1337");
    final AI ai = new AI();

    socket.on(Socket.EVENT_CONNECT, new Emitter.Listener() {

      @Override
      public void call(Object... args) {
        socket.emit("join", ai.ROOM, ai.TEAM);
        
        System.out.print("Lien vers le match : http://localhost:1337/");
        System.out.println(!ai.ROOM.isEmpty() ? ai.ROOM : "null");
      }

    }).on("start", new Emitter.Listener() {

      @Override
      public void call(Object... args) {
        JSONObject config = (JSONObject) args[0];
        ai.start(config);
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
        System.exit(0);
      }

    });

    socket.connect();
  }
}
