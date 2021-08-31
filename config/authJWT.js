const passport = require('passport');
const jwt = require('jsonwebtoken');
const passportJWT = require("passport-jwt");

module.exports = { 
  signToken: function(user) {
    return jwt.sign({
      iss: 'CodeWorkr',
      sub: user.id,
      iat: new Date().getTime(), // current time
      exp: new Date().setDate(new Date().getDate() + 1) // current time + 1 day ahead
    },  process.env.JWT_SECRET);
  },
  auth: passport.authenticate('jwt',{session: false}),
  ensureEnabled: function (req, res, next){
    if(req.user.isEnabled){
      return next();
    }
    res.status(401).send({ msg: "This account is disabled!"});
  }
}