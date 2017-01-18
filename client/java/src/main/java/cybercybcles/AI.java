package cybercybcles;

public class AI {
  final static String ROOM = "";
  final static String TEAM = "";

  static String direction;

  static void start(Object[] config) {
    System.out.println(config);
  }

  static String next(Object[] prevMoves) {
    System.out.println(prevMoves);

    return direction;
  }

  static void end(Object[] winnerID) {
    System.out.println(winnerID);
  }
}
