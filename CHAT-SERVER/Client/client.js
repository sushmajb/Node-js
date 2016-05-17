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