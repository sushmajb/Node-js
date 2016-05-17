(function(){
	//make a quick jquery-type selector
	var getNode = function(s) {
		return document.querySelector(s);
	};

	//get form elements

	var user_email_input = getNode('#user_email'),
		user_password_input = getNode('#user_password'),
		submit_button = getNode('#submit_button');

	//attempt to establish a connection to server
	try{
		var server = io.connect('http://127.0.0.1:8080');
	}
	catch(e) {
		alert('sorry, could not connect. try again later');
	}

	//if successful
	if(server !== undefined) {
		console.log("connection established...");
		//add event listener for login submit button
		submit_button.addEventListener('click',function(event){

			//create variablesto send to server and assign them values
			var user_email = user_email_input.value,
				user_password = user_password_input.value;

			//send values to server
			server.emit('login' , {
				user_email: user_email,
				user_password: user_password
			});
			event.preventDefault;
		});

		//alert error message returned from server
		server.on('alert', function(msg){
			alert(msg);
		});

		//clear login form
		server.on('clear-login', function(){
			user_email_input.value = '';
			user_password_input.value = '';
		});

		server.on('redirect',function(href) {
			sessionStorage.setItem('ss_user_email', user_email_input.value);
			window.location.assign(href);
		});
	}
})();