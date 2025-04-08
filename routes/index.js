const {Router} = require('express')
const app = Router()
const usersController = require("../controllers/userController");
const { body } = require("express-validator");

app.get("/", usersController.getAllUsers);

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

module.exports = app;