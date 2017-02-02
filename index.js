var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

//var basket = {};

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  console.log(socket.id + ' user connected.');  
  //basket[socket.id] = socket.id;
 
  setInterval(emitMessageCount, 3000, socket.id);

  socket.on('disconnect', function(){
    console.log(socket.id + ' user disconnected');
  });

  socket.on('chat message', function(msg){
    console.log('message: ' + msg);
    //send the message to everyone, including the sender.
    io.emit('chat message', msg);
    //send a message to everyone except for a certain socket
    //socket.broadcast.emit('hi');
  });

});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

function emitMessageCount(socketId) {
    io.to(socketId).emit('message-count', {socketId: socketId, messageCount: getRandomInt(0,10)}); 
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}