#!/bin/sh

# Server
npm start --prefix server &

# Client
mvn package -f client/pom.xml

mvn exec:java -f client/pom.xml -Droom=test -Dteam=blue &
mvn exec:java -f client/pom.xml -Droom=test -Dteam=blue &

mvn exec:java -f client/pom.xml -Droom=test -Dteam=red &
mvn exec:java -f client/pom.xml -Droom=test -Dteam=red &
