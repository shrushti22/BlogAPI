
//importing dependencies
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const saltRounds = 10;

// create app
const app = express();

// configure app to use bodyparser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


//import User and blog model
var User = require('./models/usermodel.js');
var Blog = require('./models/blogmodel.js');




///////////////////--------------- requests for user register, login and delete-----------///////////////////////////

app.post('/user', function(req, res) {
    if(!req.body.username || !req.body.password) 
        return res.status(400).send("Username or Password not provided.")

    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        if(err) 
            return res.status(501).send("Failed to register User")
        const user = new User({
            username: req.body.username,
            password: hash
        })
        user.save(function(err){
            if(err) 
                return res.status(501).send("Failed to register User")

            return res.status(201).send("User registered successfully")
        })
    }); 
});

app.get("/user",function(req,res){
    
    if(!req.body.username || !req.body.password) 
        return res.status(400).send("Username or Password not provided.")

    User.findOne({
        username: req.body.username
    }, function(err,user){

        if(err) 
            return res.status(501).send("Failed to login.")

        if(user.length==0) 
            return res.status(400).send("User not found.")

        bcrypt.compare(req.body.password, user.password, function(err, result) {

            if(err) 
                return res.status(501).send("Failed to login.")

            if(result==true){

                var token = jwt.sign({id: user._id, username: user.username}, process.env.SECRET, {expiresIn: 360000});
                return res.status(200).send({ auth: true, token: token });

            }else{
                return res.status(400).send("Incorrect Password.")
            }

        });

    })
})

app.delete("/user", function(req, res){
    var token = req.headers['x-access-token'];
    if(!token) 
        return res.status(400).send({auth: false, message: "Token not provided"})

    jwt.verify(token, process.env.SECRET, function(err, decoded) {
        if (err) 
            return res.status(501).send({ auth: false, message: 'Failed to authenticate token.' });

        User.findByIdAndDelete(decoded.id, function(err){
            if(err) 
            return res.status(501).send("Failed to delete")

            Blog.deleteMany({userid: decoded.id}, function(err){
                if(err) 
                    return res.status(501).send("Failed to delete")

                return res.status(200).send({"message": "User deleted successfully"});
            })
        })
    });
})



/////////////////////////-------------------request for all blogs-------------------////////////////////////////////

app.get("/blogs", function(req,res){
    var token = req.headers['x-access-token'];
    if(!token) 
        return res.status(400).send({auth: false, message: "Token not provided"})

    jwt.verify(token, process.env.SECRET, function(err, decoded) {
        if (err) 
            return res.status(400).send({ auth: false, message: 'Failed to authenticate token.' });
        Blog.find({}, ["title", "username", "description"], function(err,found){
            if(err) 
                return res.status(501).send("Failed to get blogs")

            if(found.length!=0){
                result = [];
                found.forEach(function(blog){
                    result.push({
                        Title: blog.title,
                        Author: blog.username,
                        Description: blog.description 
                    })
                })
                return res.status(200).send(result);
            }else{
                var a = ["No Blogs to show"];
                return res.status(200).send(a);
            }
        })
    }); 
})



///////////////////------------------ request to get a particular blog----------------/////////////////////////

app.get("/blogs/:blogTitle", function(req,res){
    var token = req.headers['x-access-token'];
    if(!token) 
        return res.status(400).send({auth: false, message: "Token not provided"})

    jwt.verify(token, process.env.SECRET, function(err, decoded) {
        if (err) 
            return res.status(501).send({ auth: false, message: 'Failed to authenticate token.' });
        
        Blog.find({title: req.params.blogTitle}, function(err,found){
            if(err) 
                return res.status(501).send("Failed to get the blog.")
            
            if(found.length!=0){
                return res.status(200).send({Title: found[0].title, Author: found[0].username, Description: found[0].description})
            }else{
                return res.status(200).send({"message" : "Blog not found"});
            }
        })
    });
})



//////////////////////------------------ requests for logged users blogs-----------------/////////////////////////////

app.route("/user/blogs")
    .get(function(req,res){
        var token = req.headers['x-access-token'];
        if(!token) 
            return res.status(400).send({auth: false, message: "Token not provided"})

        jwt.verify(token, process.env.SECRET, function(err, decoded) {
            if (err) 
                return res.status(501).send({ auth: false, message: 'Failed to authenticate token.' });
            Blog.find({userid : decoded.id }, ["title" ,"username", "description"], function(err,found){
                if(err) 
                    return res.status(501).send("Failed to get blogs")

                if(found.length!=0){
                    result = [];
                    found.forEach(function(blog){
                        result.push({
                            Title: blog.title,
                            Author: blog.username,
                            Description: blog.description 
                        })
                    })
                    return res.status(200).send(result);
                }else{
                    var a = ["No Blogs to Show"];
                    return res.status(200).send(a);
                }
            })
        }); 
    })

    .post(function(req,res){
        var token = req.headers['x-access-token'];
        if(!token) 
            return res.status(400).send({auth: false, message: "Token not provided"})

        if(!req.body.title) 
            return res.status(400).send("Blog must have Title")

        jwt.verify(token, process.env.SECRET, function(err, decoded) {
            if (err)
                return res.status(501).send({ auth: false, message: 'Failed to authenticate token.' });

            var blog = new Blog({
                title : req.body.title,
                userid : decoded.id,
                username : decoded.username,
                description : req.body.description 
            })
            blog.save(function(err){
                if(err) 
                    return res.status(501).send("Failed to save the Blog.")

                return res.status(200).send({"message": "Blog saved successfully."})
            })
        }); 
    })

    .delete(function(req,res){
        var token = req.headers['x-access-token'];
        if(!token) 
            return res.status(400).send({auth: false, message: "Token not provided"})

        jwt.verify(token, process.env.SECRET, function(err, decoded) {
            if (err) 
                return res.status(501).send({ auth: false, message: 'Failed to authenticate token.' });
            
            Blog.deleteMany({userid: decoded.id}, function(err){
                if(err) 
                    return res.status(501).send("Failed to delete your blogs.")

                return res.status(200).send({"message": "All blogs deleted successfully"})
            })
        });
    });




////////////////////////-------------------- requests for partcular blog---------------/////////////////////////////

app.route("/user/blog/:blogTitle")
    .get(function(req,res){
        var token = req.headers['x-access-token'];
        if(!token) 
            return res.status(400).send({auth: false, message: "Token not provided"})

        jwt.verify(token, process.env.SECRET, function(err, decoded) {
            if (err) 
                return res.status(501).send({ auth: false, message: 'Failed to authenticate token.' });
            
            Blog.find({title: req.params.blogTitle, userid: decoded.id}, function(err,found){
                if(err) 
                    return res.status(501).send("Failed to get the blog.")
                
                if(found.length!=0){
                    return res.status(200).send({Title: found[0].title, Description: found[0].description})
                }else{
                    return res.status(200).send({"message" :"Blog not found"});
                }
            })
        });
    })

    .put(function(req,res){
        var token = req.headers['x-access-token'];
        if(!token) 
            return res.status(400).send({auth: false, message: "Token not provided"})

        if(!req.body.title || !req.body.description) 
            return res.send("Title and description not provided")

        jwt.verify(token, process.env.SECRET, function(err, decoded) {
            if (err) 
                return res.status(501).send({ auth: false, message: 'Failed to authenticate token.' });
            
            Blog.updateOne({
                title: req.params.blogTitle,
                userid: decoded.id
            },{ 
                title: req.body.title,
                userid: decoded.id,
                username: decoded.username,
                description: req.body.description 
            }, function(err, result){
                if(err) 
                    return res.status(501).send("Failed to update the blog.")
                
                if(result.length!=0){
                    return res.status(200).send({"message": "Updated the Blog Successfully"})
                }else{
                    return res.status(200).send({"message": "Blog not found"});
                }
            })
        });
    })

    .delete(function(req,res){
        var token = req.headers['x-access-token'];
        if(!token) 
            return res.status(400).send({auth: false, message: "Token not provided"})

        jwt.verify(token, process.env.SECRET, function(err, decoded) {
            if (err) return res.status(501).send({ auth: false, message: 'Failed to authenticate token.' });
            
            Blog.deleteOne({
                title: req.params.blogTitle,
                userid: decoded.id
            }, function(err){
                if(err) 
                    return res.status(501).send("Failed to delete the specified blog.")
                return res.status(200).send({"message": "Specified blog deleted successfully."})
            })
        });
    });


module.exports = app.listen(3000);

