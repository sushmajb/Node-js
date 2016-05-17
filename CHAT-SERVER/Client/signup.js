//create toggle function
(function() {
	var checkbox = document.getElementById('photo_option');
	var is_checked;
	var photo_input = document.getElementById('photo_input');

	function toggle(){
		if(!is_checked) {
			photo_input.style.display = "block";
			is_checked = true;
		}
		else {
			photo_input.style.display = "none";
			is_checked = false;
		}
		return is_checked;
	}
	checkbox.addEventListener('click', toggle);
})();

//upload function

(function(){
//SELECT
	//selector function
	var getNode = function(s) {
		return document.querySelector(s);
	};

	//get form nodes
	var user_email_input = getNode('#user_email'),
		user_name_input = getNode('#user_name'),
		photo_option = getNode('#photo_option'),
		fpass_input = getNode('#password_first'),
		cpass_input = getNode('#password_confirm'),

	//attempt a connection to server
	try{
		var server = io.connect('http://127.0.0.1:8080');
	}
	catch(e){
		alert('sorry we couldnot connect.Please try again later\n' +
			 e);
	}

//CONNECT
	//if connection is successful
	if(server !== undefined) {
		//add event listener for login submit button
		submit_button.addEventListener('click', function(event){
			//create variables to send to server and assign them values
			var user_email = user_email_input.value,
				user_name = user_name_input.value,
				photo_option = photo_input.value,
				fpass = fpass_input.value,
				cpass = cpass_input.value;

			//test photo input
			if(photo_option === ''){
				photo_option = "default";
			}

			//send values to server
			server.emit('join', {
				user_email: user_email,
				user_name: user_name,
				photo_option: photo_option,
				fpass: fpass,
				cpass: cpass
			});
			event.preventDefault;
		});

		//alert error messages returned from the server
		server.on('alert', function(msg){
			alert(msg);
		});

		//clear login form
		server.on('clear-login', function(){
			user_email_input.value = '';
			user_name.value = '';
			photo_option.checked = false;
			photo_input.value = '';
			photo_input.style.display = 'none';
			fpass_input.value = '';
			cpass_input.value = '';
		});
	}

})();