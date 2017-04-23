
// import all required modules: express and http 
var bodyParser = require('body-parser');
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// Template engine consolidation library
var cons = require('consolidate');

// set the port number 
var port = (process.env.PORT != undefined ? process.env.PORT : 8080);

// this line actually serves all files under the public folder 
app.use('/', express.static(__dirname + '/public'));

// tell the application to use the body-parser middleware 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.engine('html', cons.hogan);

var users = [];
var CHAT_NORMAL = 0, CHAT_SPECIAL = 1;

io.on('connection', function(socket) {
	socket.on('msg', function(msg) {
		console.log(msg);
		var data = JSON.parse(msg);

		if(data.type == CHAT_NORMAL) {
			io.emit('msg', msg);
		} else {
			data.content = generateSpecialMessage(data);
			io.emit('special', data.content);	
		}
	});

	socket.on('connect-data', function(data) {
		data = JSON.parse(data);

		console.log(data.name + " connected");
		users.push({socket: socket, user: data});

		io.emit('special', "<span style=\"color: #48b19b\">" + data.name + "</span> connected");
	});

	socket.on('icon-change', function(icon) {
		var user;
		for(var i = 0; i < users.length; i++) {
			if(users[i].socket == socket) {
				users[i].user.icon = icon;
				user = users[i].user;
				break;
			}
		}

		io.emit('icon-change', JSON.stringify(user));
	});

	socket.on('name-change', function(data) {
		data = JSON.parse(data);
		for(var i = 0; i < users.length; i++) {
			if(users[i].user.name == data.old) {
				users[i].user.name = data.new;
				break;
			}
		}

		io.emit('name-change', JSON.stringify(data));
	});

	socket.on('disconnect', function() {
		var name = "";
		for(i = 0; i < users.length; i++) {
			if(users[i].socket == socket) {
				name = users[i].user.name;
				console.log(users[i].user.name + " disconnected");
				users.splice(i, 1);
				break;
			}
		}

		io.emit('special', "<span style=\"color: #48b19b\">" + name + "</span> disconnected");
	});
});

var sitEmotes = [
	"sits down pretzel style cause they're cool like that.",
	"sits down to rest.",
	"sits down because they can't handle the standing."
]

var laughEmotes = [
	"laughs at everyone in this chat.",
	"laughs maniacally while rubbing hands together.",
	"laughs",
	"chuckles",
	"giggles",
	"tee-hee's like an anime girl"
]

var yawnEmotes = [
	"yawns.",
	"yawns out of boredom.",
	"yawns sleepily."
]

var hideEmotes = [
	"sees a spider and hides in complete fear.",
	"hides in an undisclosed location.",
	"hides in plain sight."
]

var screamEmotes = [
	"screams in agonizing terror.",
	"screams in furious rage.",
	"screams like a fan-girl.",
	"screams and breaks a wine glass."
]

function generateSpecialMessage(msg) {
	if(msg.content == "/sit")
		return "<span style=\"color: #48b19b\">" + msg.name + "</span> " + sitEmotes[randBetween(0, sitEmotes.length - 1)];
	else if(msg.content == "/laugh")
		return "<span style=\"color: #48b19b\">" + msg.name + "</span> " + laughEmotes[randBetween(0, laughEmotes.length - 1)];
	else if(msg.content == "/yawn")
		return "<span style=\"color: #48b19b\">" + msg.name + "</span> " + yawnEmotes[randBetween(0, yawnEmotes.length - 1)];
	else if(msg.content == "/hide")
		return "<span style=\"color: #48b19b\">" + msg.name + "</span> " + hideEmotes[randBetween(0, hideEmotes.length - 1)];
	else if(msg.content == "/scream")
		return "<span style=\"color: #48b19b\">" + msg.name + "</span> " + screamEmotes[randBetween(0, screamEmotes.length - 1)];
	else
		return "<span style=\"color: #48b19b\">" + msg.name + "</span> tried to do an emote that doesn't exist. Everyone point and laugh at them!"
}

function randBetween(min, max) {
	min = Math.ceil(min);
  	max = Math.floor(max);
  	return Math.floor(Math.random() * (max - min + 1)) + min;
}

// initiates the server and listens for connections on the port 
http.listen(port, function() {
    console.log("Listening on port " + port);
});

