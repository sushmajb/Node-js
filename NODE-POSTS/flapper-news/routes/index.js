var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');
var User = require('../models/Users'); //mongoose.model('User');
var passport = require('passport');
var jwt = require('express-jwt');

//middleware for authenticating jwt tokens
var auth = jwt({secret: 'SECRET', userProperty: 'payload'});

//GET home page.
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

//returns JSON list containing all posts
router.get('/posts', function(req, res, next) {
    Post.find(function(err, posts){
        if(err){
            return next(err);    
        }
        res.json(posts);
    });
});

//POST request(like get and post method) to the server for creating posts
router.post('/posts', auth, function(req, res, next) {
    var post = new Post(req.body);
    post.author = req.payload.username;
    post.save(function(err, post) {
        if(err) {
            return next(err);
        }
        res.json(post);
    });
});

//Creating a route for preloading post objects
router.param('post', function(req, res, next, id) {
    var query = Post.findById(id);
    
    query.exec(function (err, post) {
        if(err) {
            return next(err);
        }
        if(!post) {
            return next(new Error('can\'t find a post'));
        }
        req.post = post;
        return next();
    });
});

//Creating a route for preloading comment objects
router.param('comment', function(req, res, next, id) {
    var query = Comment.findById(id);
    
    query.exec(function (err, comment) {
        if(err) {
            return next(err);
        }
        if(!comment) {
            return next(new Error('can\'t find a comment'));
        }
        req.comment = comment;
        return next();
    });
});


//creating route for returning single post
router.get('/posts/:post', function(req, res) {
    req.post.populate('comments', function(err, post) {
        if (err) { 
            return next(err); 
        }
        res.json(post);
    });
});



//creating route for upvotes
router.put('/posts/:post/upvote', auth, function(req, res, next) {
    req.post.upvote(function(err, post){
        if(err){
            return next(err);
        }
        res.json(post);
    });
});


//creating comments router
router.post('/posts/:post/comments', auth, function(req, res, next) {
    var comment = new Comment(req.body);
    comment.post = req.post;
    comment.author = req.payload.username;

    comment.save(function(err, comment) {
        if(err){ 
            return next(err); 
        }

        req.post.comments.push(comment);
        req.post.save(function(err, post) {
            if(err) { 
                return next(err); 
            }

            res.json(comment);
        });
    });
});

//creating route for upvotes
router.put('/posts/:post/comments/:comment/upvote', auth, function(req, res, next) {
    req.post.comment.upvote(function(err, post){
        if(err){
            return next(err);
        }
        res.json(post);
    });
});

//creates a user - given username and password
router.post('/register', function(req, res, next) {
    if(!req.body.username || !req.body.password){
        return res.status(400).json({
            message: 'Please fill out all fields'
        });
    }
    try {
        var user = new User();
        user.username = req.body.username;
        user.setPassword(req.body.password);
        user.save(function (err) {
            if(err) {
                return next(err);
            }

            return res.json({
                token: user.generateJWT()
            });
        });
    } catch(error) {
        console.log("Message: " + error.message);
        return next(error.message);
    }
});

//creating routes tat authenticates user and returns a token to client
router.post('/login', function(req, res, next) {
    if(!req.body.username || !req.body.password){
        return res.status(400).json({message: 'Please fill out all fields'});
    } 

    passport.authenticate('local', function(err, user, info){
        if(err) {
            return next(err);
        }
        if(user) {
            return res.json({token: user.generateJWT()});
        }
        else {
            return res.status(401).json(info);
        }
    })(req, res, next);
});

module.exports = router;
