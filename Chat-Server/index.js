var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path =require('path');

//initialise application with route
app.get('/',function(req,res) {
	var express = require('express');
	app.use(express.static(path.join(__dirname)));
	res.sendFile(path.join(__dirname, '../Chat-Server', 'index.html'));
});

//register events on socket connection
io.on('connection', function(socket) {
	socket.on('chatMessage', function(from,msg) {
		io.emit('chatMessage', from, msg)
	});
	socket.on('notifyUser', function(user) {
		io.emit('notifyUser', user);
	});
});

//listen application request on port 3000
http.listen(3000, function() {
	console.log('listening on *: 3000');
});