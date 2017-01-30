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

    socket.on(Socket.EVENT_CONNECT, new Emitter.Listener() {

      @Override
      public void call(Object... args) {
        socket.emit("join", AI.ROOM, AI.TEAM);
      }

    }).on("start", new Emitter.Listener() {

      @Override
      public void call(Object... args) {
        JSONObject config = (JSONObject) args[0];
        AI.start(config);
      }

    }).on("next", new Emitter.Listener() {

      @Override
      public void call(Object... args) {
        JSONArray prevMoves = (JSONArray) args[0];
        socket.emit("move", AI.next(prevMoves));
      }

    }).on("end", new Emitter.Listener() {

      @Override
      public void call(Object... args) {
        String winnerID = (String) args[0];
        AI.end(winnerID);
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
