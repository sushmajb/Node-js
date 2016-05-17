(function (){
	var getDocNode = function(sel){
		return document.querySelector(sel);
	},

	//get required nodes
	session_username = sessionStorage.getItem('ss_user_email'),
	chat_title = getDocNode('#chat-title'),
	messages = getDocNode('.chat-messages'),
	textarea = getDocNode('.chat-app textarea'),
	status  = getDocNode('.chat-status span'),
	statusDefault = status.textContent,

	setStatus = function(s) {
		status.textContent = s;
		if(s != statusDefault){
			var delay  = setTimeout(function() {
				setStatus(statusDefault);
				clearInterval(delay);
			},3000)
		}
	};

	//attempt connection to server

	try{
		var server = io.connect('http://127.0.0.1:8080');
	}catch(e) {
		alert('sorry we could not connect. please try again \n' + e);
	}

	//if server connection is successful
	if(server !== undefined) {
		server.emit('chat-connection', sessionStorage.getItem('ss_user_email'));
	}

	server.on('update-title', function(name){
		name += ', ';
		chat_title.innerHTML = name.concat(chat_title.innerHTML);
	});

	// listens for the output function from server to be fired - displays messages from database
        server.on('output', function (svdata) {
    // if the object has value
            if (svdata.length) {
                // loop through the messages array
                for (var i = 0; i < svdata.length; i++) {

                    // create a wrapper for each message
                    var wrapper = document.createElement('div');
                    wrapper.setAttribute('class', 'chat-wrapper');

                    // create a picture wrapper
                    var picWrapper = document.createElement('div');
                    picWrapper.setAttribute('class', 'pic-wrapper');

                    // add picWrapper element
                    wrapper.appendChild(picWrapper);

                    // create the image
                    var image = document.createElement('img');

                    image.setAttribute('src', svdata[i].photo);
                    image.setAttribute('class', 'profile-pic');


                    image.setAttribute('width', '100%');
                    image.setAttribute('height', '100%');
                    picWrapper.appendChild(image);


                    // add an event listener to fix broken images
                    image.addEventListener('error', function(){
                        this.onerror = "";
                        this.src = "http://i1072.photobucket.com/albums/w368/"
                                + "jamesrallen2011/profile.jpg_zpsgjdxq5gd.png";
                        return true;
                    });

                    // create the actual message
                    var message = document.createElement('div');
                    message.setAttribute('class', 'chat-message');


                    var msg = '<span>';


                    if (svdata[i].email === session_username) {
                        msg += 'You:</span>';
                    } else {
                        msg += svdata[i].name + ':</span>';
                    }

                    message.innerHTML = msg;

                    message.innerHTML += svdata[i].message;


                    // append newly created element to chat wrapper
                    wrapper.appendChild(message);
                    wrapper.scrollTop = messages.scrollHeight;

                    // append the whole thing to chat messages
                    messages.appendChild(wrapper);

                    messages.scrollTop = messages.scrollHeight;

                }
            }
        });


        //listen for status
        server.on('status', function (data) {
            setStatus((typeof svdata === 'object') ? svdata.message : svdata);

            if (svdata.clear === true) {
                textarea.value = "";
            }
        });

        //listen for the enter key to pressed
        textarea.addEventListener('keydown', function(event){
        	if(event.which === 13 && event.shiftKey === false){
        		server.emit('input',{
        			email: session_username,
        			message: this.value
        		});
        		event.preventDefault;
        	}
        });
})();