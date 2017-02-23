#!/bin/sh

HOST="kekstarter.org"

# Deletes build/test directories
rm -r client/target
rm -r client/src/test

# Generates the guide
pandoc -V geometry:margin=1in client/README.md -o client/README.pdf

# Edits the host
sed -i "s/localhost/${HOST}/" client/pom.xml

# Compresses the client
zip -r cybercycles.zip client -x README.md

# Edits back the host
sed -i "s/${HOST}/localhost/" client/pom.xml

# Deletes the generated guide
rm client/README.pdf
