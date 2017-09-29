// Require HTTP module (to start server) and Socket.IO
var http = require('http'),
    fs = require('fs'),
    io = require('socket.io');
var finalhandler = require('finalhandler');
var serveStatic = require('serve-static');
var serve = serveStatic("./");
var mongoose = require('mongoose');

// Start the server at port 3000
var server = http.createServer(function(req, res) {
    if (req.url === "/") {
        fs.readFile("socket-client.html", function(error, pgResp) {
            if (error) {
                res.writeHead(404);
                res.write('Contents you are looking are Not Found');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.write(pgResp);
            }

            res.end();
        });
    } else {
        var done = finalhandler(req, res);
        serve(req, res, done);
    }
});


server.listen(process.env.PORT || 3000);

// Create a Socket.IO instance, passing it our server
var socket = io.listen(server);
var clients = 0;
var clientid;

// Add a connect listener
socket.on('connection', function(client) {
    ++clients;
    clientid = client.id;

    // Success!  Now listen to messages to be received
    client.on('message', function(event) {
        var newMsg = new Chat({ msg: '' + event, senderid: '' + clientid });
        newMsg.save(function(err){
            console.log('saved, err = ' + err);
            if(err) throw err;
            console.log('echoeing back data =' + event);
            socket.emit('customevent', event);
        });
    });

    socket.emit('ucount', clients + " active connections");

    client.on('disconnect', function() {
        --clients;
        console.log('Server has disconnected');
    });
});

var chatSchema = mongoose.Schema({
    msg: String,
    senderid: String,
    created: { type: Date, default: Date.now }
});

var Chat = mongoose.model('Message', chatSchema);

var MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatdb';

mongoose.connect(MONGODB_URI, function(err) {
    if (err) {
        console.log(err);
    } else {
        console.log('Connected to mongodb!');
    }
});

