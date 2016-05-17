var app = angular.module('flapperNews', ['ui.router']);//external module ui-router
//creating new object o that has an array property called posts
app.factory('posts', [function(){
	var o = {
		posts: []
	};
	return o;
}]);

// controller for posts template
app.controller('MainController',['$scope','posts',
	function($scope,posts){
		$scope.addPost = function() {
			if(!$scope.title || $scope.title === '') { 
				return;
			}

			//JSON object holding post value pair
			$scope.posts.push({
				title : $scope.title,
				link: $scope.link,
				upvotes: 0,
				comments:[]
			});
			$scope.title = '';
			$scope.link = '';
		};

		$scope.incrementUpvotes = function(post) {
			post.upvotes += 1;
		};
		// display our array of posts tat exist in posts factory
		$scope.posts = posts.posts;// two way data binding. 
}]);

//controller for comments template
app.controller('PostsCtrl', [
	'$scope',
	'$stateParams',
	'posts',
	function($scope, $stateParams, posts) {
		$scope.post = posts.posts[$stateParams.id];

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
	     	controller: 'MainController'
	    })

	    .state('posts', {
			url: '/posts/{id}',
			templateUrl: '/posts.html',
			controller: 'PostsCtrl'
		});

		$urlRouterProvider.otherwise('home');
	}
]);