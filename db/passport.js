const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const {findUserByUsername,findUserById} = require('./queries');
const { validPassword } = require('./passwordUtils');
const pool = require('./pool');
const bcrypt = require('bcryptjs');

const strategy = new LocalStrategy((async (username, password, done) => {
      try {
        const { rows } = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
        const user = rows[0];
        console.log(user)
  
        if (!user) {
          return done(null, false, { message: "Incorrect username" });
        }
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
        // passwords do not match!
        return done(null, false, { message: "Incorrect password" })
        }
        return done(null, user);
      } catch(err) {
        return done(err);
      }
    }));

passport.use(strategy);

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (userId, done) => {
    findUserById(userId)
        .then(user => {
            done(null, user);
        })
        .catch((err) => {
            console.log(err);
            done(err);
        })
});