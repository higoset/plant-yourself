var http = require('http');
var io = require('socket.io')(server);
var url = require('url');
var fs = require('fs');

console.log("Server listening on Port 8000");

var Player = function(n, s){
    var ret = {
        Name: n,
        Socket: s,
        Score: 0,
        Voted: false,
        It: false,
    };
    
    return ret;
}

var players = [0,0,0,0,0,0,0,0];
var numPlayers = 0;
var host = null;

var server = http.createServer(function(request, response){
        var path = url.parse(request.url).pathname;

        switch(path){
            case '/':
                response.writeHead(200, {'Content-Type': 'text/html'});
                response.write('hello world');
                response.end();
                break;
            case '/index.html':
                fs.readFile(__dirname + path, function(error, data){
                    if (error){
                        response.writeHead(404);
                        response.write("oops this doesn't exist - 404");
                        response.end();
                    }
                    else{
                        response.writeHead(200, {"Content-Type": "text/html"});
                        response.write(data, "utf8");
                        response.end();
                    }
                });
                break;
            default:
                response.writeHead(404);
                response.write("oops this doesn't exist - 404");
                response.end();
                break;
        }
    });

server.listen(8000);

var listener = io.listen(server);

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
}