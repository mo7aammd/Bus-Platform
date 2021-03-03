const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Company = require('../models/Company');

module.exports = function(passport){
    passport.use(
        new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
            Company.findOne({ email: email})
            .then(company => {
                if(!company){
                    return done(null, false, { message: 'That email not registred'});
                }
                bcrypt.compare(password, company.password, (err, isMatch) => {
                    if(err) throw err
                    
                    if(isMatch){
                        return done(null, company);
                    } else {
                        return done(null, false, { message: 'Password incorrect' })
                    }
                });
            })
            .catch((err) => console.log(err));
        })
    );

    passport.serializeUser((company, done) => {
        done(null, company.id);
      });
      
      passport.deserializeUser((id, done) => {
        Company.findById(id, (err, company) => {
          done(err, company);
        });
      });
}