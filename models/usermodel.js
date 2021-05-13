const mongoose = require('mongoose');

mongoose.connect("mongodb://localhost:27017/BlogDB", 
{useNewUrlParser: true, useUnifiedTopology: true})
    .catch(error => handleError(error));

const userSchema = new mongoose.Schema({
    username: String,
    password: String
});

const User = new mongoose.model('User', userSchema);

module.exports = User;