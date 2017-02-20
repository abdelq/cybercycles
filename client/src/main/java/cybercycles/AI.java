package cybercycles;

import org.json.JSONArray;
import org.json.JSONObject;

public class AI {
    /* Configuration */
    public final String ROOM = "";
    public final String TEAM = "";

    /* Déplacement de l'A.I. */
    public String direction; // Valeurs acceptées : "u", "l", "d", "r"

    /**
     * Fonction appelée en début de partie.
     *
     * @param config Configuration de la grille de jeu
     */
    public void start(JSONObject config) {

        System.out.print("Taille de la grille : ");
        System.out.println(config.getInt("w") + "x" + config.getInt("h"));

        System.out.println("Nombre d'obstacles : " + config.getJSONArray("obstacles").length());
    }

    /**
     * Fonction appelée à chaque tour de jeu.
     *
     * @param prevMoves Mouvements précédents des joueurs
     * @return Mouvement à effectuer
     */
    public String next(JSONArray prevMoves) {
        System.out.println(prevMoves);

        // TODO : décider de la prochaine direction dans laquelle se déplacer
        direction = "u";

        return direction;
    }

    /**
     * Fonction appelée en fin de partie.
     *
     * @param winnerID ID de l'équipe gagnante
     */
    public void end(String winnerID) {
        System.out.println("Gagnant : " + winnerID);
    }
}
