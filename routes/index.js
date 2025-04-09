const passport = require('passport');
const {Router} = require('express')
const app = Router()
const usersController = require("../controllers/userController");
const { body } = require("express-validator");
const multer  = require('multer')
const path = require('path');


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './uploads/'); // Ensure this directory exists
    },
    filename: function (req, file, cb) {
      // Generate a unique filename to avoid collisions
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });

const upload = multer({ storage: storage });

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    console.log("User not authenticated, redirecting to /");
    return next();
}



app.get("/signup", (req, res) => {
    res.render("signup", {errors: []});
});

app.post("/signup",
    body('username')
        .trim()
        .notEmpty().withMessage('Username is required.')
        .custom(async (username, {req}) => {
            const exists = await usersController.checkUserExist(username);
            if (exists) {
                throw new Error('Username already exists.');
            }
        }),
    body('passwordConfirmation')
        .custom((value, { req }) => {if (value !== req.body.password) {
            throw new Error('Passwords must match.'); // Throw error within custom validator
        } return true;}),
    (req, res, next) => usersController.newUser(req,res))

app.post(
    "/login",
    passport.authenticate("local", {
      successRedirect: "/",
      failureRedirect: "/login-failed"
    })
);

app.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) {
        return next(err);
        }
        res.redirect("/");
    });
})

app.get("/login-failed", (req, res) => res.render("login-failed"));

app.get("/",ensureAuthenticated, usersController.triggerHomeOrFolderView);

app.get("/folder/:folderId", ensureAuthenticated, usersController.triggerHomeOrFolderView);

app.post("/upload", upload.single('file'), (req, res, next) => {
    usersController.handleFileUpload(req, res, next)
});

app.post("/folder/create", ensureAuthenticated, usersController.handleCreateFolder);

app.get("/rename/:itemId", ensureAuthenticated, usersController.triggerRenameForm);

app.post("/rename/:itemId", ensureAuthenticated, usersController.handleRenameItem);

app.post("/delete/:itemId", ensureAuthenticated, usersController.handleDeleteItem);

// app.post("/download/:itemId", ensureAuthenticated, usersController.handleDownloadItem);

module.exports = app;