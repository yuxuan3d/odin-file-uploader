const db = require("../db/queries");
const {genPassword} = require("../db/passwordUtils");
const { body, validationResult } = require('express-validator');
const pool = require("../db/pool");


async function getAllUsers(req, res) {
  const users = db.getAllUsers() 
  res.render("index", {
    title: "Usernames"
  })
}

async function checkUserExist(username) {
    const user = db.findUserByUsername(username)
    return user
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
      db.createUser(username, password.hash, salt)
      res.redirect("/");
    } catch (error) {
      console.error(error);
      next(error);
    }
}

// async function newPost(req, res, user) {
//   try {
//     const messageText = req.body.text;
//     const messageTitle = req.body.title;
//     const messageTime = getCurrentPostgresTimestampLocal()
//     await pool.query("insert into posts (username, title, sent, contents) values ($1, $2, $3, $4)", [user.username, messageTitle,messageTime,messageText]);
//     res.redirect("/");
//    } catch (error) {
//       console.error(error);
//       res.status(500).send("Internal Server Error");
//      }
// }

// async function newUser(req, res) {
//   const errors = validationResult(req);

//   if (!errors.isEmpty()) {
//     console.error("Validation errors:", errors.array());
//     // Handle errors (e.g., re-render form)
//     return res.status(422).render('signup', {
//         errors: errors.array(),
//     });
//   }

//   try {
//     const username = req.body.username;
//     const password = await genPassword(req.body.password);
//     const salt = password.salt;
//     createUser(username, password.hash, salt)
//     res.redirect("/");
//   } catch (error) {
//     console.error(error);
//     next(error);
//   }
// }

// async function deletePost(id) {
//     const client = await pool.connect();
//     try {
//         const result = await deleteQuery(id)
//         return
//     } catch (err) {
//         throw err;
//     } finally {
//         client.release();
//     }
// }

module.exports = {
  getAllUsers,
  checkUserExist,
  newUser
  };