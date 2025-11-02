const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();
const axios = require('axios');

const userExist = (username) => {
    let usersWithSameName = users.filter((user) => {
        return user.username === username;
    });

    if (usersWithSameName.length > 0) {
        return true;
    }

    return false;
}

function fakeAdapter() {
  return new Promise((resolve) => {
    const timeout = 2000;

    setTimeout(() => {
      resolve({
        data: books,
        status: 200,
        headers: {}
      });
    }, timeout);
  });
}

async function fetchBooksFromFakeService() {
  const axiosClient = axios.create({
    adapter: fakeAdapter,
  });

  return await axiosClient.get("https://api.fakedomain.com/books");    
}

// Get the book list available in the shop
public_users.get('/', async function (req, res) {
  const apiResponse = await fetchBooksFromFakeService();
  const booksData = apiResponse.data;
  const transformedBooks = Object.entries(booksData).map(
    ([isbn, book]) => ({ isbn, ...book })
  );

  return res.json({ books: transformedBooks });
});

public_users.post("/register", (req,res) => {
    const username = req.body.username;
    const password = req.body.password;

    if (username && password) {
        if (!userExist(username)) {
            users.push({"username": username, "password": password});
            
            return res.status(200).json({message: "User successfully registered. Now you can login"});
        }

        return res.status(404).json({message: "User already exists!"});
    }

    return res.status(404).json({message: "Unable to register user."});
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn', async function (req, res) {
  const isbn = req.params.isbn;
  const apiResponse = await fetchBooksFromFakeService();
  const booksData = apiResponse.data;
  const book = booksData[isbn];
  
  if (!book) {
    return res.status(404).json({message: `Book with ISBN ${isbn} not found`});
  }

  return res.json({ book });
 });
  
// Get book details based on author
public_users.get('/author/:author', async function (req, res) {
  const author = req.params.author;
  const booksByAuthor = [];
  const apiResponse = await fetchBooksFromFakeService();
  const booksData = apiResponse.data;

  for (const entry in booksData) {
    if (booksData[entry]["author"].toLowerCase() === author.toLowerCase()) {
      booksByAuthor.push(booksData[entry]);
    }
  }

  if (booksByAuthor.length === 0) {
    return res.status(404).json({message: `No books found by author ${author}`});
  }

  return res.json( { books: booksByAuthor } );
});

// Get all books based on title
public_users.get('/title/:title', async function (req, res) {
  const title = req.params.title;
  const booksByTitle = [];
  const apiResponse = await fetchBooksFromFakeService();
  const booksData = apiResponse.data;

  for (const entry in booksData) {
    if (booksData[entry]["title"].toLowerCase() === title.toLowerCase()) {
      booksByTitle.push(booksData[entry]);
    }
  }

  if (booksByTitle.length === 0) {
    return res.status(404).json({message: `No books found with title ${title}`});
  }

  return res.json({ books: booksByTitle });
});

//  Get book review
public_users.get('/review/:isbn',function (req, res) {
  const isbn = req.params.isbn;
  const book = books[isbn];
  
  if(!book){
    return res.status(404).json({message: `Book with ISBN ${isbn} not found`});
  }

  var reviews = book["reviews"];
  if (Object.keys(reviews).length === 0) {
    return res.status(404).json({message: `No reviews found for book with ISBN ${isbn}`});
  }

  return res.json({ reviews });
});


module.exports.general = public_users;
