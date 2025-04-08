const express = require('express')
const passport = require('passport');
const session = require('express-session');
const app = express()
const path = require("node:path");
const index = require("./routes/index")
const { PrismaSessionStore } = require('@quixo3/prisma-session-store');
const { PrismaClient } = require('./generated/prisma')

require('./db/passport');

require('dotenv').config();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(session({
    store: new PrismaSessionStore(
        new PrismaClient(),
        {
          checkPeriod: 2 * 60 * 1000,  //ms
          dbRecordIdIsSessionId: true,
          dbRecordIdFunction: undefined,
        }
      ),
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24
    }
})
)

app.use(passport.initialize());
app.use(passport.session());

app.use(express.urlencoded({ extended: true }));

app.use("/", index)

const PORT = 3000
app.listen(PORT, () => {
  console.log(`listening on port http://localhost:${PORT}`)
})