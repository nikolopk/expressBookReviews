const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username)=>{ //returns boolean
//write code to check is the username is valid
}

const authenticatedUser = (username,password)=>{
    let validusers = users.filter((user) => {
        return (user.username === username && user.password === password);
    });

    if (validusers.length > 0) {
        return true;
    }
    
    return false;
}

//only registered users can login
regd_users.post("/login", (req,res) => {
    const username = req.body.username;
    const password = req.body.password;

    if (!username || !password) {
        return res.status(404).json({ message: "Error logging in" });
    }

    if (authenticatedUser(username, password)) {
        let accessToken = jwt.sign({
            data: password
        }, 'access', { expiresIn: 60 * 60 });

        req.session.authorization = {
            accessToken, username
        }

        return res.status(200).json({ message: "User successfully logged in" });
    }
    
    return res.status(208).json({ message: "Invalid Login. Check username and password" });
});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const review = req.body.review;
    const username = req.session.authorization.username;

    if (!books[isbn] || !review) {
        return res.status(400).json({ message: "Invalid ISBN or review" });
    }

    var existingReviews = books[isbn]["reviews"];
    var existingReviewsByUser = existingReviews.filter(r => r.username === username);

    if (existingReviewsByUser.length > 0) {
        existingReviewsByUser[0].value = review;

        return res.json({ message: "Review updated successfully" });
    }

    existingReviews.push({ "username": username, "value": review });

    return res.json({ message: "Review added successfully" });
});

//Delete a book review
regd_users.delete("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const username = req.session.authorization.username;

    if (!books[isbn]) {
        return res.status(400).json({ message: "Invalid ISBN" });
    }

    var reviews = books[isbn]["reviews"];
    var existingReviewsByUser = reviews?.filter(r => r.username === username);

    if (existingReviewsByUser.length === 0) {
        return res.status(404).json({ message: `No reviews found for this book by ${username}` });
    }

    books[isbn]["reviews"] = reviews.filter(r => r.username !== username);

    return res.json({ message: "Review deleted successfully" });
});


module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
