#!/bin/sh

HOST="kekstarter.org"

# Generates the guide
pandoc -V geometry:margin=1in client/README.md -o client/README.pdf

# Edits the host
sed -i "s/localhost/${HOST}/" client/pom.xml

# Compresses the client
zip -r cybercycles.zip client -x client/README.md client/target client/src/test

# Edits back the host
sed -i "s/${HOST}/localhost/" client/pom.xml
