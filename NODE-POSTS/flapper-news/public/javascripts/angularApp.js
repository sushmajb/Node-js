var app = angular.module('flapperNews', ['ui.router']);//external module ui-router
//creating new object o that has an array property called posts
app.factory('posts', ['$http', 'auth', function($http, auth) {
	var o = {
		posts: []
	};
	
	//get is a read operation
	o.getAll = function() {
    	return $http.get('/posts')
    	.success(function(data){
      		angular.copy(data, o.posts);
    	});
  	};
	
	//to get a single post
	o.get = function(id) {
  		return $http.get('/posts/' + id)
  		.then(function(res){
    		return res.data;
  		});
	};


	// post is a create operation
	o.create = function(post) {
  		return $http.post('/posts', post, {
    		headers: {Authorization: 'Bearer '+ auth.getToken()}
  		}).success(function(data){
			o.posts.push(data);
  		});
	}; 

	//put is a update operation
	o.upvote = function(post) {
  		return $http.put('/posts/' + post._id + '/upvote', null, {
    		headers: {Authorization: 'Bearer ' + auth.getToken()}
  		}).success(function(data){
      		post.upvotes += 1;
		});
	};

	o.addComment = function(id, comment) {
		return $http.post('/posts/' + id + '/comments', comment, {
	    	headers: { Authorization: 'Bearer ' + auth.getToken()}
		});
	};


	o.upvoteComment = function(post, comment) {
		return $http.put('/posts/' + post._id + '/comments/'+ comment._id + '/upvote', null, {
			headers: { Authorization: 'Bearer '+ auth.getToken()}
 		 }).success(function(data){
	    	comment.upvotes += 1;
	    });
	};		

	return o;
}])

//for user authentications
.factory('auth', ['$http', '$window', function($http, $window){
	var auth = {};

	//getting and setting out token to localstorage
	auth.saveToken = function(token) {
		$window.localStorage['flapper-news-token'] = token;
	};

	auth.getToken = function() {
		return $window.localStorage['flapper-news-token'];
	};

	//return a boolean value if user is logged in
	auth.isLoggedIn = function(){
		var token = auth.getToken();
		if(token){
			/* payload is the middle part of token betwen the two .'s
			its JSON object that has been base 64. we can get it back to a stringnified JSON by using $window.atob().
			and then back to a javascript object with JSON.parse
			*/
			var payload = JSON.parse($window.atob(token.split('.')[1]));

			return payload.exp > Date.now() / 1000;		
		}
		else
			return false;
	};

	//returns the username of user thats logged in
	auth.currentUser = function(){
		if(auth.isLoggedIn()){
			var token = auth.getToken();
			var payload = JSON.parse($window.atob(token.split('.')[1]));

			return payload.username;
		}
	};

	//Create a register function that posts a user to our /register route and saves the token returned
	auth.register = function(user){
		return $http.post('/register', user).success(function(data){
			auth.saveToken(data.token);
		});
	};

	//function posts a user to our /login route and saves token returned
	auth.logIn = function(user){
		return $http.post('/login', user).success(function(data){
			auth.saveToken(data.token);
		});
	};

	//function tat removes the user's token from localStorage, logging the user out
	auth.logOut = function(){
		$window.localStorage.removeItem('flapper-news-token');
	};

	return auth;
}]);

// controller for posts template
app.controller('MainController',['$scope','posts', 'auth',
	function($scope,posts, auth){
		$scope.addPost = function() {
			if(!$scope.title || $scope.title === '') { 
				return;
			}

		  	//Save post in server - mongodb
		  	posts.create({
		    	title: $scope.title,
		    	link: $scope.link,
		  	});
		  	
		  	$scope.title = '';
			$scope.link = '';
		};

		$scope.incrementUpvotes = function(post) {
			posts.upvote(post);
		};
		// display our array of posts tat exist in posts factory
		$scope.posts = posts.posts;// two way data binding. 

		$scope.isLoggedIn = auth.isLoggedIn;
}])

//controller for comments template
.controller('PostsCtrl', [
	'$scope',
	'posts',
	'post',
	'auth',
	function($scope, $posts, post, auth) {
		$scope.post = post;

		$scope.addComment = function(){
			if($scope.body === ''){
				return;
			}
			$scope.post.comments.push({
				body: $scope.body,
				author: 'user',
				upvotes: 0
			});
			$scope.body = '';
		};

		$scope.incrementUpvotes = function(comment) {
			posts.upvoteComment(post, comment);
		};
	}
	])

//authentication controller
.controller('AuthCtrl', [
	'$scope',
	'$state',
	'auth',
	function($scope, $state, auth){
		$scope.user = {};

		$scope.register = function(){
			auth.register($scope.user).error(function(error){
				$scope.error = error;
			}).then(function(){
				$state.go('home');
			   });
		};

		$scope.logIn = function(){
			auth.logIn($scope.user).error(function(error){
				$scope.error = error;
			}).then(function(){
				$state.go('home');
				});
		};

	}])

	// navigation bar controller
	.controller('NavCtrl', [
		'$scope',
		'auth',
		function($scope, auth){
			$scope.isLoggedIn = auth.isLoggedIn;
			$scope.currentUser = auth.currentUser;
			$scope.logOut = auth.logOut;
		}
	]);


//configure homestate using stateprovider and urlrouterprovider.otherwise() to redirect
app.config([ 
	'$stateProvider',
	'$urlRouterProvider',
	function($stateProvider, $urlRouterProvider) {
		$stateProvider
	    .state('home', {
	     	url: '/home',
	     	templateUrl: '/home.html',
	     	controller: 'MainController',
		  	resolve: {
		    	postPromise: ['posts', function(posts){
		      		return posts.getAll();
		    	}]
		  	}
	    })

	    .state('posts', {
			url: '/posts/{id}',
			templateUrl: '/posts.html',
			controller: 'PostsCtrl',
			resolve: {
			    post: ['$stateParams', 'posts', function($stateParams, posts) {
			   		return posts.get($stateParams.id);
			    }]
			}
		})

		.state('login', {
			url: '/login',
			templateUrl: '/login.html',
			controller: 'AuthCtrl',
			onEnter: ['$state', 'auth', function($state, auth){
			    if(auth.isLoggedIn()){
			      $state.go('home');
			    }
			}]
		})

		.state('register', {
			url: '/register',
		    templateUrl: '/register.html',
		    controller: 'AuthCtrl',
		    onEnter: ['$state', 'auth', function($state, auth){
		    	if(auth.isLoggedIn()){
		      	  $state.go('home');
		    	}
		    }]
		});

		$urlRouterProvider.otherwise('home');
	}
]);