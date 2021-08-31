const LocalStrategy = require("passport-local").Strategy;
const GoogleTokenStrategy = require("passport-google-id-token");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Company = require("../models/Company");
const Admin = require("../models/Admin");
const passportJWT = require("passport-jwt");
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;
const { Customer } = require("../models/Customer");

module.exports = function (passport) {
  passport.use(
    "local.user",
    new LocalStrategy({ usernameField: "email" }, (email, password, done) => {
      Company.findOne({ email: email })
        .then((company) => {
          if (!company) {
            return done(null, false, { message: "That email not registred" });
          }
          bcrypt.compare(password, company.password, (err, isMatch) => {
            if (err) throw err;

            if (isMatch) {
              return done(null, company);
            } else {
              return done(null, false, { message: "Password incorrect" });
            }
          });
        })
        .catch((err) => console.log(err));
    })
  );

  passport.use(
    "local.admin",
    new LocalStrategy({ usernameField: "email" }, (email, password, done) => {
      Admin.findOne({ email: email })
        .then((admin) => {
          if (!admin) return done(null, false, { message: "That email not registred" });
          //if (password == admin.password) done(null, admin); 
          //else done(null, false, { message: "Password incorrect" });
          
              bcrypt.compare(password, admin.password, (err, isMatch) => {
                  if(err) throw err
                  if(isMatch){
                      return done(null, admin);
                  } else {
                      return done(null, false, { message: 'Password incorrect' })
                  }
              });
            
        })
        .catch((err) => console.log(err));
    })
  );

  passport.use(
    new GoogleTokenStrategy(
      {
        clientID:
          "177578822071-3d5ve549u81k4chpmttsfl3no1u2tn6a.apps.googleusercontent.com",
      },
      function (parsedToken, googleId, done) {
        console.log(parseInt);
        console.log(googleId);
        User.findOrCreate({ googleId: googleId }, function (err, user) {
          return done(err, user);
        });
      }
    )
  );

  passport.use(
    new JWTStrategy(
      {
        jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.JWT_SECRET,
      },
      function (jwtPayload, done) {
        return Customer.findById(jwtPayload.sub)
          .then((user) => {
            return done(null, user);
          })
          .catch((err) => {
            return done(err);
          });
      }
    )
  );

  passport.serializeUser((user, done) => {
    let isAdmin = user.isAdmin ? true : false;
    done(null, { id: user.id, isAdmin });
  });

  passport.deserializeUser((data, done) => {
    if (data.isAdmin) {
      Admin.findById(data.id, (err, admin) => {
        done(err, admin);
      });
    } else {
      Company.findById(data.id, (err, company) => {
        done(err, company);
      });
    }
  });
};
