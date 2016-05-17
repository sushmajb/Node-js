//create connection variables
var mongo = require('mongodb').MongoClient;
//establish a connection from index.html to socket.io
var client = require('socket.io').listen(8080).sockets;

//connect to  database
// start a connection to mongo db and tell server.js wher to find it.
//wrap the connection between client and server inside the connection to db to make db connection mandatory

mongo.connect('mongodb://127.0.0.1/chat', function(err, db) {

	var usercount = 0;
	if(err) throw err;
	console.log("server started successfully");
	client.on('connection' , function(socket){
		socket.on('join', function(data){
			//listens for join event, which passesa socket object to event handler callback function
			var user_email = data.user_email,
				user_name = data.user_name,
				photo_option = data.photo_option,
				fpass = data.fpass,
				cpass = data.cpass;

			//check for empty fields
			if(user_email === '' ||user_name === '' ||  cpass === '' || fpass === ''){
				socket.emit('alert', 'Whoops, you missed one !');
				return;
			}

			//check for matching password
			if(fpass !== cpass) {
				socket.emit('alert', 'your password donot match');
				return;
			}

			//create database variable
			var users = db.collection('users');

			//create a variable to hold the data object
			users.find().sort({_id: 1}).toArray(function(err, res){
				if(err) throw err;

				//create a flag variable
				var newUser = user_email;

				var doesUserExist = function(newUser, res){
					if(res.length) {
						for(var i=0; i<res.length; i++){
							var answer;
							if(newUser === res[i].user_email){
								answer = "exists";
								break;
							}
							else {
								answer = "does not exist";
							}
						}
						return answer;
					}
					else
					{
						return answer = "does not exist";
					}
				};

				var found = doesUserExist(newUser, res);

				if(found !== "exists"){
					//if not found, push the user into the db
					user.insert({
						user_email: user_email,
						user_name: user_name,
						photo_option: photo_option,
						password:cpass
					},function(){
						socket.emit('alert','your account has been created');
						socket.emit('clear-login');
						return found;
					});
				}
				else{
					socket.emit('alert', 'User name already exit, use another username');
				}
			});
		});



		//server side login event listener

		socket.on('login', function(login_info){
			var this_user_email = login_info.user_email,
				this_user_password = login_info.user_password;

			if(this_user_email === '' || this_user_password === ''){
				socket.emit('alert', 'you must fill in both the fields');
			}
			else{
				var users = db.collection('users');
				users.find().toArray(function(err,res){
					if(err) throw err;

					var found = false,
						location = -1;
					
					if(res.length){
						for(i = 0; i<res.length; i++){
							if(res[i].user_email === this_user_email){
								found = true;
								if(res[i].password === this_user_password){
									socket.emit('redirect','chat.html');
								}
								else
								{
									socket.emit('alert','Please retry password');
								}
								break;
							}
						}
						if(!found){
							socket.emit('alert','sorry, could not find you.please sign up.');
						}	socket.emit('redirect','signup.html');
					}				
				})
			}
		});


		socket.on('chat-connection', function(ss_user_email) {
			var users = db.collection('users');
			users.find({
				'user_email':ss_user_email
			}).toArray(function(err,res){
				if(err) throw err;

				var user = res[0];

				socket.broadcast.emit('status',user.user_name + ' has just joined the chat room');
				socket.emit('update-title', user.user_name);

				//declare variable to hold collection and function to update the status
				var collectn = db.collection('messages'),
				sendStatus = function(s){
					socket.emit('status',s);
				};

				//emit all chat messages
				collectn.find().limit(100).sort({
					_id:1
				}).toArray(function(err,res){
					if(err) throw err;
					socket.emit('output',res);

					//wait for input
					socket.on('input', function(data){
						//values here okay

						var email = data.email,
							photo = user.photo_option,
							name = user.user_name,
							message = data.message;

						var new_msg = {
							email: email,
							photo: photo,
							name: name,
							message: message
						};

						//checkthat message box has value
						if(message !== "") {
							collectn.insert(
								new_msg,
								function() {
									//emit latest message to all clients
									client.emit('output',[new_msg]);

									sendStatus({
										message: "Message sent",
										clear: true
									});
								});
						}else {
							sendStatus('Name or message is missing');
						}

					});
				});

				socket.on('disconnect', function() {
					socket.broadcast.emit('status', user.user_name + 'has just left the chat room');
				});
			});
		});

	});
});