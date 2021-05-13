const mongoose = require('mongoose');

mongoose.connect("mongodb://localhost:27017/BlogDB", 
{useNewUrlParser: true, useUnifiedTopology: true})
    .catch(error => handleError(error));

const blogSchema = new mongoose.Schema({
    title: String,
    username: String,
    userid: mongoose.Schema.Types.ObjectId,
    description: String
})

const Blog = new mongoose.model('Blog', blogSchema);

module.exports = Blog;