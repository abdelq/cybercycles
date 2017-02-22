#!/bin/bash

server="http://localhost:1337"

room=bracket-num

teams=(the-super-twados twado-the-fifth)

clients=(/home/k/src/cybercycles/client
         /home/k/src/cybercycles/client
         /home/k/src/cybercycles/client
         /home/k/src/cybercycles/client)

function start {
    (
        local team
        cd ${clients[$1]}
        
        if [ $1 -lt 2 ]
        then
            team=${teams[0]}
        else
            team=${teams[1]}
        fi

        echo $1 - $team

        # mvn -q package > /dev/null 2> /dev/null
        mvn -q exec:java -Dexec.args="$server $room $team" | tail -n 1 | grep winnerID >> ../bot-$1
    )
}

rm bot-{0,1,2,3}

for number in $(seq 1)
do
    start 0 &
    start 1 &
    start 2 &
    start 3 # Wait for the game to end
done

if ! diff bot-0 bot-1 || ! diff bot-0 bot-2 || ! diff bot-0 bot-3
then
    echo wat
fi

sort bot-3 | uniq -c > winrar
