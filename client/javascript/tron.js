const io = require('socket.io-client');
const ai = require('./ai');

const socket = io('http://localhost:1337');

socket.on('connect', () => {
    if (ai.room) {
        socket.emit('join', ai.room, ai.team);
        console.log(`Lien vers le match : http://localhost:1337/${ai.room}`);
    } else {
        console.log("Veuillez choisir un nom pour votre chambre");
        process.exit();
    }
});

socket.on('start', (config) => {
    ai.start(config);
});

socket.on('next', (prevMoves) => {
    socket.emit('move', ai.next(prevMoves));
});

socket.on('end', (winnerID) => {
    ai.end(winnerID);
    process.exit();
});

socket.on('disconnect', () => {
    console.log("Vous avez été déconnecté");
    process.exit();
});
