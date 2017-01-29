package cybercybcles;

import io.socket.client.IO;
import io.socket.client.Socket;
import io.socket.emitter.Emitter;
import java.net.URISyntaxException;

public class Tron {
  public static void main(String[] args) throws URISyntaxException {
    Socket socket = IO.socket("http://localhost:1337");

    socket.on(Socket.EVENT_CONNECT, new Emitter.Listener() {
      @Override
      public void call(Object... args) {
        socket.emit("join", AI.ROOM, AI.TEAM);
      }
    }).on("start", new Emitter.Listener() {
      @Override
      public void call(Object[] config) {
        AI.start(config);
      }
    }).on("next", new Emitter.Listener() {
      @Override
      public void call(Object[] prevMoves) {
        socket.emit("move", AI.next(prevMoves));
      }
    }).on("view", new Emitter.Listener() {
      @Override
      public void call(Object[] grid) {
        System.out.println(grid);
      }
    }).on("end", new Emitter.Listener() {
      @Override
      public void call(Object[] winnerID) {
        AI.end(winnerID);
        System.exit(0);
      }
    });

    socket.connect();
  }
}
