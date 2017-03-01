# Cybercycles

Dépôt contenant le serveur et le client utilisés à l'[édition 2017 du hackathon du DIRO](//hackathon.iro.umontreal.ca/2017).

## Exigences

* [Node.js](https://nodejs.org), pour le serveur
* [Apache Maven](https://maven.apache.org), pour le client

## Installation

### Serveur

``` bash
cd server
npm install
```

## Utilisation

### Serveur

``` bash
cd server
npm start
```

### Client

``` bash
mvn package
mvn exec:java
```
