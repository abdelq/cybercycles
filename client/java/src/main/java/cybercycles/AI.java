package cybercycles;

import org.json.JSONArray;
import org.json.JSONObject;

public class AI {
  /* Configuration */
  public final static String ROOM = "";
  public final static String TEAM = "";

  /* Déplacement de l'A.I. */
  public static String direction; // Valeurs acceptées : 'u', 'l', 'd', 'r'

  /**
   * Fonction appelée en début de partie.
   *
   * @param config Configuration de la grille de jeu
   */
  public static void start(JSONObject config) {
    System.out.println(config);
  }

  /**
   * Fonction appelée à chaque tour de jeu.
   *
   * @param prevMoves Mouvements précédents des joueurs
   * @return Mouvement à effectuer
   */
  public static String next(JSONArray prevMoves) {
    System.out.println(prevMoves);

    return direction;
  }

  /**
   * Fonction appelée en fin de partie.
   *
   * @param winnerID ID de l'équipe gagnante
   */
  public static void end(String winnerID) {
    System.out.println(winnerID);
  }
}
