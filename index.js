var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var socketsBasket = [];


/* TODOs
  1. Each socket participates in the consumer group for messages.
  2. Every socket in the  consumer group receives all the messages.
  3. Each browser client socket sends in user id to associate with socket id, UNREAD message count (sql) is sent back
     on initial connect.
  4. Socket in the group responds to the CDC based on the user id/socket id association.  
  5. When browser client requests messages (sql is run to show the results).
  6. A CDC from kafka for a given user id /socket id triggers corresponding sql for messages.
*/

/////////************** M Y S Q L ****************/////////////
var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'admin',
  password : 'admin',
  database : 'demo'
});

connection.connect();

/////////************** K A F K A****************/////////////
var kafka = require('kafka-node'),
    Consumer = kafka.Consumer,
    client = new kafka.Client(),
    consumer = new Consumer(
        client,
        [{ topic: 'localmysql.demo.message', partition: 0 }],
        {autoCommit: false}
    );
consumer.on('message', function (message) {
    let messageValueJson = JSON.parse(message.value);
    console.log(message.value);
    let messageValuePayloadJson = messageValueJson.payload;    
    if(messageValuePayloadJson != null) {
      getUnReadMessageCount(1);
      getMessagesForUser(1);
    }
});

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  console.log(socket.id + ' user connected.');  
  socketsBasket.push(socket.id);

  socket.on('disconnect', function(){
    console.log(socket.id + ' user disconnected');
  });
 
  socket.on('establish-identity', function(userId) {
    console.log('USER ID:', userId);
    getUnReadMessageCount(userId);
    getMessagesForUser(userId);
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

/*function emitMessageCount(socketId) {
    io.to(socketId).emit('message-count', {socketId: socketId, messageCount: getRandomInt(0,10)}); 
}*/

function getUnReadMessageCount(userId) {
   connection.query("SELECT COUNT(*) AS cnt FROM message WHERE hasRead='N' AND userId=" + userId, function (error, results, fields) {
    if (error) throw error;        
    console.log(results[0].cnt);
    io.emit('message-count', {socketId: 1, messageCount: results[0].cnt});
  });
}

function getMessagesForUser(userId) {
  connection.query("SELECT * FROM message WHERE hasRead='N' AND userId=" + userId + " ORDER BY createdOn DESC", function (error, results, fields) {
    if (error) throw error;
    io.emit('message-awaiting', results);
  });
}