const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const {findUserById, findUserByUsername} = require('./queries');
const bcrypt = require('bcryptjs');

const strategy = new LocalStrategy((async (username, password, done) => {
      try {
        const user = await findUserByUsername(username);
        
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