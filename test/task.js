const chai = require("chai");
const chaiHttp = require("chai-http");
const server = require("../index");
var mongoose = require("mongoose");
const { expect } = require("chai");


//Assertion Style
chai.should();

var token = "";

chai.use(chaiHttp);

describe('User', function(){

    it("Should Register user, login user ", function(done){
        chai.request(server)
            // register request
            .post("/user")
            .send({
                'username': 'shrushti',
                'password': '123456'
            })
            .end(function(err, res){
                res.should.have.status(201);
                // follow up with login
                chai.request(server)
                    //login request
                    .get("/user")
                    .send({
                        'username': 'shrushti',
                        'password': '123456'
                    })
                    .end(function(err, res){
                        // this runs the login part
                        res.should.have.status(200);
                        res.body.should.have.property('token');
                        token = res.body.token;
                        done();
                        
                    })
            })
    })
    
    it("Should allow logged in user to access all blogs", function(done){
        chai.request(server)
            //access all available blogs
            .get("/blogs")
            .set({'x-access-token': token})
            .end(function(err, res){
                res.should.have.status(200);
                expect(res.body).to.be.a("array");
                done();
        })
    })

    it("Should allow user to create a blog, delete a particular blog, update a particular blog, view a particular blog", function(done){
        chai.request(server)
            //create a blog
            .post("/user/blogs")
            .set({'x-access-token': token})
            .send({
                'title': "new",
                "description": "This is a new blog"
            })
            .end(function(err, res){
                res.should.have.status(200);
                expect(res.body).to.be.a("object");

                //follow up with view a prticular
                chai.request(server)
                    .get("/blogs/new")
                    .set({'x-access-token': token})
                    .end(function(err, res){
                        res.should.have.status(200);
                        expect(res.body).to.be.a("object");

                        chai.request(server)
                            .get("/user/blog/new")
                            .set({'x-access-token': token})
                            .end(function(err, res){
                                res.should.have.status(200);
                                expect(res.body).to.be.a("object");
                                
                                //follow up with update a particular
                                chai.request(server)
                                    .put("/user/blog/new")
                                    .set({'x-access-token': token})
                                    .send({
                                        'title': "new",
                                        "description": "This is a new blog. My name is shrushti."
                                    })
                                    .end(function(err,res){
                                        res.should.have.status(200);
                                        expect(res.body).to.be.a("object");

                                        chai.request(server)
                                            .delete("/user/blog/new")
                                            .set({'x-access-token': token})
                                            .end(function(err,res){
                                                res.should.have.status(200);
                                                expect(res.body).to.be.a("object");
                                                done();
                                            })
                                    })
                            })    
                    })
            })
    })

    it("Should allow user to access his/her all blogs and delete all blogs", function(done){
        chai.request(server)
            .get("/user/blogs")
            .set({'x-access-token': token})
            .end(function(err, res){
                res.should.have.status(200);
                expect(res.body).to.be.a("array");

                // follow up with delete all blogs
                chai.request(server)
                    .delete("/user/blogs")
                    .set({'x-access-token': token})
                    .end(function(err,res){
                        res.should.have.status(200);
                        expect(res.body).to.be.a("object");
                        done();
                    })
            })
    })

    it("Should be able to delete user", function(done){
        chai.request(server)
            .delete("/user")
            .set({'x-access-token': token})
            .end(function(err, res){
                res.should.have.status(200);
                expect(res.body).to.be.a("object");
                done();
            })

    })

})
