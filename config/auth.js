module.exports = {
  ensureAuth: function (req, res, next) {
    if (req.isAuthenticated() && !req.user.isAdmin) {
      return next();
    }
    req.flash("error_msg", "Please log in to view this resource");
    res.redirect("/users/login");
  },
  authAdmin: function (req, res, next) {
    if (req.isAuthenticated() && req.user.isAdmin) {
      return next();
    }
    req.flash("error_msg", "Please log in to view this resource");
    res.redirect("/admin/login");
  },
  ensureEnabled: function (req, res, next){
    if(req.user.isEnabled){
      return next()
    }
    req.flash("error_msg", "This Account is Disabled");
    res.redirect("/dashboard");
  }
};
