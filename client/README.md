CyberCycles
===========

Défi
----

Cette année, vous devrez programmer des intelligences artificielles qui sauront combattre leurs adversaires dans un environnement inspiré de [TRON].

Directives
----------

La première chose à effectuer est de choisir une valeur pour `ROOM` autre que *default*, commune aux membres de votre équipe.

Par la suite, pour pouvoir tester votre AI, vous devez démarrer deux instances, dans la même chambre, avec une valeur différente de `TEAM`.

Pour rendre les choses plus simples, vous pouvez laisser `TEAM` vide et le serveur s'occupera de générer l'identifiant de votre équipe. Dans ce cas, vous n'aurez qu'à démarrer le même programme deux fois.

À noter que vos modifications doivent principalement se faire dans `AI.java`, ainsi que dans d'autres fichiers que vous pouvez créer.

Structure
---------

### Début de partie

Au début de la partie, `start` est appelé. Vous recevez un objet en *JSON* qui contient la configuration du jeu, générée par le serveur.

Voici un exemple de ce `JSONObject` :

``` {.json}
{
  "players": [{
    "x": 1,
    "y": 19,
    "id": "1",
    "team": "1",
    "direction": "u"
  }, {
    "x": 30,
    "y": 21,
    "id": "2",
    "team": "2",
    "direction": "u"
  }],
  "obstacles": [{
    "w": 3,
    "x": 37,
    "h": 4,
    "y": 13
  }, {
    "w": 3,
    "x": -2,
    "h": 4,
    "y": 12
  }],
  "w": 38,
  "h": 29,
  "me": "1"
}
```

`players` est un tableau qui contient des objets représentant des joueurs, avec leurs coordonnées de départ (`x` et `y`), leur identifiant (`id`), leur équipe (`team`) et leur direction `direction`.

`obstacles` est un tableau qui contient des objets représentant des obstacles sur la grille de jeu, avec leurs coordonnées (`x` et `y`), leurs dimensions (`w` sur l'axe des *x* et `h` sur l'axe des *y*).

Finalement, `w` représente la longueur de la grille, `h` représente la largeur de la grille et `me` représente votre propre identifiant.

### À chaque tour de jeu

À chaque tour de jeu, `next` est appelé. Vous recevez alors un tableau en *JSON* qui contient les mouvements précédents des joueurs, tel que reçues par le serveur.

Le `JSONArray` ressemble à ce qui suit :

``` {.json}
[{
  "id": "1",
  "direction": "u"
}, {
  "id": "2",
  "direction": "u"
}]
```

Chaque `JSONObject` contient l'identifiant du joueur (`id`) et sa direction prise durant le dernier tour de jeu (`direction`).

`direction` doit être retourné dans `next` suite à la décision prise par votre intelligence artificielle, à chaque tour de jeu.

`direction` est un `String` qui n'accepte que les valeurs suivantes :

-   `u` pour **up** (haut)
-   `l` pour **left** (gauche)
-   `d` pour **down** (bas)
-   `r` pour **right** (droite)

### Fin de partie

À la fin de la partie, `end` est appelé avec, comme attribut, l'identifiant de l'équipe qui a gagné.

Il n'est pas nécessaire de faire quelque chose avec la valeur, mais ça peut vous être utile durant les tests.

  [TRON]: https://fr.wikipedia.org/wiki/Tron
