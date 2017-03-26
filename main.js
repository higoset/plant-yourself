var http = require('http');
var io = require('socket.io')(server);
var url = require('url');
var fs = require('fs');

//Player object contructor
var Player = function(n, s){
    var ret = {
        Name: n,
        Socket: s,
        Score: 0,
        Vote: 0,
        It: false,
    };

    return ret;
}

var players = [0,0,0,0,0,0,0,0];
var numPlayers = 0;
var host = null;

var server = http.createServer(function(request, response){
  if(req.url === '/'){
    res.writeHead(200, {'Content-Type': 'text/html'});
    fs.createReadStream(__dirname + '/index.html').pipe(res);
  } else {
    res.writeHead(404, {'Content-Type': 'text/html'});
    fs.createReadStream(__dirname + '/404.html').pipe(res);
  }
});
server.listen(8000);
console.log("Server listening on Port 8000");

var listener = io.listen(server);

var round = {
    correct: 0
}

listener.sockets.on('connection', function(socket){

    if(numPlayers < 9)
        socket.emit('prompt');
    else
        socket.emit('full');

    socket.on('name', function(data){

        if(host == null){
            socket.emit('host');
            host = Player('host', socket);
            console.log("Host Connected");
            console.log(host);
        }
        else{
            players[numPlayers] = Player(data, socket);
            if(numPlayers == 0)
                socket.emit('starter');
            else
                socket.emit('wait');

            console.log(numPlayers);

            updatePlayers(data);

            numPlayers++;
        }
    });

    socket.on('client_data', function(data){
        socket.emit(data);

        for(var i = 0; i < numPlayers; i++){
            if(data.name == players[i].Name){
                console.log(data);
                players[i].Vote = data.choice;
            }
        }

        if(checkVotes())
            endRound();
    })

    socket.on('start', function(){
        startRound();
    })

});

function updatePlayers(data){
    host.Socket.emit('new', data);
}

function startRound(){
    host.Socket.emit('roundStartHost');

    var it = Math.floor(Math.random() * numPlayers);

    for(var i = 0; i < numPlayers; i++){
        if(i == it){
            round.correct = getRandomLetter();
            players[i].Socket.emit('it', round.correct);
            players[i].It = true;
        }
        else{
            players[i].Socket.emit('notIt', players[it].Name);
        }
    }
}

function getRandomLetter(){

    var num = Math.floor(Math.random() * 3);

    switch(num){
        case 0:
            return "A";
        case 1:
            return "B";
        case 2:
            return "C";
    }

}

function checkVotes(){
    for(var i = 0; i < numPlayers; i++){
        if(players[i].Vote == 0 && !players[i].It)
            return false;
    }
    return true;
}

function endRound(){
    for(var i = 0; i < numPlayers; i++){
        if(players[i].Vote == round.correct){
            players[i].Socket.emit('correct');
            players[i].score++;
        }
        else
            players[i].Socket.emit('wrong');

    }
}
