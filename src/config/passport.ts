import passport from "passport";
import passportLocal from "passport-local";

const LocalStrategy = passportLocal.Strategy;

passport.use(new LocalStrategy({usernameField: 'email', passwordField: 'passwd'},
  function (username, password, done) {

    let user: any;
    return done(null, user);

  }
));