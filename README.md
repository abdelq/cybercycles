# Cybercycles

Dépôt contenant le serveur et le client utilisés à l'[édition 2017 du hackathon du DIRO](http://hackathon.iro.umontreal.ca/2017).

## Exigences

* [Node.js](https://nodejs.org), pour le serveur et le client JavaScript
* [Apache Maven](https://maven.apache.org), pour le client Java

## Utilisation

### Serveur

``` bash
cd server
npm install
npm start
```

### Client

Java:
``` bash
cd client/java
mvn package
mvn exec:java
```

Javascript:
``` bash
cd client/javscript
npm install
npm start
```
