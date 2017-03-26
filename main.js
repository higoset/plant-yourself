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

var images = [
    'http://users.wpi.edu/~ejcerini/Pictures/saguaro1.png',
    'http://users.wpi.edu/~ejcerini/Pictures/acacia1.png',
    'http://users.wpi.edu/~ejcerini/Pictures/round.png',
    'http://users.wpi.edu/~ejcerini/Pictures/afro.png',
    'http://users.wpi.edu/~ejcerini/Pictures/banan.png',
    'http://users.wpi.edu/~ejcerini/Pictures/beet.png',
    'http://users.wpi.edu/~ejcerini/Pictures/borb.png',
    'http://users.wpi.edu/~ejcerini/Pictures/corn.png',
    'http://users.wpi.edu/~ejcerini/Pictures/downed.png',
    'http://users.wpi.edu/~ejcerini/Pictures/droopy.png',
    'http://users.wpi.edu/~ejcerini/Pictures/fern.png',
    'http://users.wpi.edu/~ejcerini/Pictures/joe.png',
    'http://users.wpi.edu/~ejcerini/Pictures/leaf.png',
    'http://users.wpi.edu/~ejcerini/Pictures/palm.png',
    'http://users.wpi.edu/~ejcerini/Pictures/ploopy.png',
    'http://users.wpi.edu/~ejcerini/Pictures/rose.png',
    'http://users.wpi.edu/~ejcerini/Pictures/sky.png',
    'http://users.wpi.edu/~ejcerini/Pictures/spiky.png',
    'http://users.wpi.edu/~ejcerini/Pictures/strawberry.png',
    'http://users.wpi.edu/~ejcerini/Pictures/tube.png',
    'http://users.wpi.edu/~ejcerini/Pictures/tulip.png'    
];


var server = http.createServer(function(req, res){
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

var round = function(){
    
    var rand = [-1,-1,-1];
    
    for(var i = 0; i < 3; i++){
        var done = true; 
        var int;
        do{
            done = true;
            int = Math.floor(Math.random() * images.length);
            for(var j = 0; j < i; j++){
                if(int == rand[j])
                    done = false;
            }
        }while(!done);
        
        rand[i] = int;
    }
    
    var ret = {
        it: Math.floor(Math.random() * numPlayers),
        picture1: images[rand[0]],
        picture2: images[rand[1]],
        picture3: images[rand[2]],
        correct: Math.floor(Math.random() * 3) + 1
    }
    
    return ret;
}

var r;

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
    r = round()
    
    host.Socket.emit('roundStartHost', r);

    for(var i = 0; i < numPlayers; i++){
        if(i == r.it){
            players[i].Socket.emit('it', r.correct);
            players[i].It = true;
        }
        else{
            players[i].Socket.emit('notIt', players[r.it].Name);
        }
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
    var count = 0;
    
    for(var i = 0; i < numPlayers; i++){
        if(players[i].Vote == r.correct){
            players[i].Socket.emit('correct');
            players[i].Score++;
            count++;
        }
        else if(i != r.it)
            players[i].Socket.emit('wrong');
    }
        
    players[r.it].Socket.emit('roundEnd', count);
    players[r.it].Score += count;
    
    var sorted = sort(players);
    
    host.Socket.emit('leaderBoard', sorted);
    
}

function sort(){

    var ret = [];
    
    for(var i = 0; i < numPlayers; i++){
        ret.push({Name: players[i].Name, Score: players[i].Score});
    }
    
    for (var i = (ret.length - 1); i >= 0; i--)
    {
        for (var j = 1; j <= i; j++)
        {
            if (ret[j-1].Score < ret[j].Score)
            {
                var temp = ret[j-1];
                ret[j-1] = ret[j];
                ret[j] = temp;
            } 
        } 
    }
    
    return ret;
}
