const express = require("express");
const router = express.Router();
const Company = require("../models/Company");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const { Passport } = require("passport");
const multer = require("multer");

//MULTER CONFIG: to get file photos to temp server storage
const multerConfig = {
  storage: multer.diskStorage({
    //Setup where the user's file will go
    destination: function (req, file, next) {
      next(null, "./public/photo-storage");
    },

    //Then give the file a unique name
    filename: function (req, file, next) {
      console.log(file);
      const ext = file.mimetype.split("/")[1];
      next(null, file.fieldname + "-" + Date.now() + "." + ext);
    },
  }),

  //A means of ensuring only images are uploaded.
  fileFilter: function (req, file, next) {
    if (!file) {
      next();
    }
    const image = file.mimetype.startsWith("image/");
    if (image) {
      console.log("photo uploaded");
      next(null, true);
    } else {
      console.log("file not supported");

      //TODO:  A better message response to user on failure.
      return next();
    }
  },
};

//Multer Config
const upload = multer({
  dest: "profile",
  limits: {
    fileSize: 1000000,
  },
  filename: function (req, file, next) {
    console.log(file);
    const ext = file.mimetype.split("/")[1];
    next(null, file.fieldname + "-" + Date.now() + "." + ext);
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Please upload an image"));
    }
    cb(undefined, true);
  },
});

//Login Page
router.get("/login", (req, res) => {
  res.render("login");
});

//Rigester Page
router.get("/register", (req, res) => {
  res.render("register");
});

//Rigester Handler
router.post(
  "/register",
  upload.single("file"),
  (req, res) => {
    const { companyName, email, password, password2 } = req.body;
    let errors = [];
    if (!companyName || !email || !password || !password2) {
      errors.push({ msg: "Please enter all fields" });
    }

    if (password != password2) {
      errors.push({ msg: "Passwords do not match" });
    }

    if (password.length < 6) {
      errors.push({ msg: "Password must be at least 6 characters" });
    }

    if (errors.length > 0) {
      res.render("register", {
        errors,
        companyName,
        email,
      });
      password, password2;
    } else {
      //Validation
      Company.findOne({ email: email }).then((company) => {
        if (company) {
          //user exist
          errors.push({ msg: "Company is already registered" });
          res.render("register", {
            errors,
            companyName,
            email,
            password,
            password2,
          });
        } else {
          const newCompany = new Company({
            companyName,
            email,
            password,
          });
          bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(newCompany.password, salt, (err, hash) => {
              if (err) throw err;
              newCompany.password = hash;
              newCompany
                .save()
                .then((company) => {
                  req.flash(
                    "success_msg",
                    "You are now registered and can log in"
                  );
                  res.redirect("/users/login");
                })
                .catch((err) => console.log(err));
            });
          });
        }
      });
    }
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

//Login Handler
router.post("/login", (req, res, next) => {
  passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/users/login",
    failureFlash: true,
  })(req, res, next);
});

//Logout Handler
router.get("/logout", (req, res) => {
  req.logOut();
  req.flash("success_msg", "You are Logout");
  res.redirect("/users/login");
});

module.exports = router;
