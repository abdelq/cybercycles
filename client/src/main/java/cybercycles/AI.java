package cybercycles;

import java.util.Random;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class AI {
    /* Configuration */
    public final String ROOM = "";
    public final String TEAM = "";

    /* Déplacement de l'A.I. */
    public String[] moves = {"u", "l", "d", "r"};
    public String direction; // Valeurs acceptées : "u", "l", "d", "r"

    /**
     * Fonction appelée en début de partie.
     *
     * @param config Configuration de la grille de jeu
     * @throws org.json.JSONException
     */
    public void start(JSONObject config) throws JSONException {
        System.out.println("Joueurs : " + config.getJSONArray("players"));

        System.out.println("Obstacles : " + config.getJSONArray("obstacles"));

        System.out.print("Taille de la grille : ");
        System.out.println(config.getInt("w") + "x" + config.getInt("h"));

        System.out.println("Votre identifiant : " + config.getString("me"));
    }

    /**
     * Fonction appelée à chaque tour de jeu.
     *
     * @param prevMoves Mouvements précédents des joueurs
     * @return Mouvement à effectuer
     */
    public String next(JSONArray prevMoves) {
        System.out.println("Mouvements précdents : " + prevMoves);

        // Choisis une direction au hasard
        direction = moves[new Random().nextInt(moves.length)];
        System.out.println("Mouvement choisi : " + direction);

        return direction;
    }

    /**
     * Fonction appelée en fin de partie.
     *
     * @param winnerID ID de l'équipe gagnante
     */
    public void end(String winnerID) {
        System.out.println("Équipe gagnante : " + winnerID);
    }
}
