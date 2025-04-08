const db = require("../db/queries");
const {createUser, deleteQuery} = require("../db/queries");
const {genPassword} = require("../db/passwordUtils");
const { body, validationResult } = require('express-validator');
const pool = require("../db/pool");

function getCurrentPostgresTimestampLocal() {
  const now = new Date(); // Gets the current date and time in the local timezone

  const year = now.getFullYear();
  // getMonth() is 0-indexed (0 = January), so we add 1
  const month = (now.getMonth() + 1).toString().padStart(2, '0'); 
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0'); // 24-hour format
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');

  // Construct the timestamp string
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

async function usersListGet(req, res) {
  const messages = await db.getAllMessages();
  res.render("index", {
    title: "Usernames",
    messages: messages,
    user: req.user
  })
}

async function usersSearchGet(req, res) {
  const message = await db.searchMessages(req.params.id);
  console.log(message)
  res.render("messageDetails", 
    {
      message: message[0]
    });
}

async function newPost(req, res, user) {
  try {
    const messageText = req.body.text;
    const messageTitle = req.body.title;
    const messageTime = getCurrentPostgresTimestampLocal()
    await pool.query("insert into posts (username, title, sent, contents) values ($1, $2, $3, $4)", [user.username, messageTitle,messageTime,messageText]);
    res.redirect("/");
   } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
     }
}

async function newUser(req, res) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.error("Validation errors:", errors.array());
    // Handle errors (e.g., re-render form)
    return res.status(422).render('signup', {
        errors: errors.array(),
    });
  }

  try {
    const username = req.body.username;
    const password = await genPassword(req.body.password);
    const salt = password.salt;
    let membership = false
    if (req.body.member == "iamspecial") {
      membership = true;
    }
    let isAdmin = false
    if (req.body.admin === "on") {
      isAdmin = true;
    }
    const firstName = req.body.first;
    const lastName = req.body.last;
    createUser(firstName, lastName, username, password.hash, membership, salt,isAdmin)
    res.redirect("/");
  } catch (error) {
    console.error(error);
    next(error);
  }
}

async function deletePost(id) {
    const client = await pool.connect();
    try {
        const result = await deleteQuery(id)
        return
    } catch (err) {
        throw err;
    } finally {
        client.release();
    }
}

module.exports = {
    usersListGet,
    usersSearchGet,
    newPost,
    newUser,
    deletePost
  };