const express = require("express");
const router = express.Router();
var Fawn = require("Fawn");
const Company = require("../models/Company");
const Account = require("../models/Account");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const { Passport } = require("passport");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { promisify } = require("util");
const unlinkAsync = promisify(fs.unlink);

const storage = multer.diskStorage({
  destination: "./public/profile/",
  filename: function (req, file, cb) {
    cb(null, "comProfile-" + Date.now() + path.extname(file.originalname));
  },
});

// Init Upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 },
  fileFilter: function (req, file, cb) {
    if (file == undefined) {
      return cb(new Error("Image not provide"));
    }
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Please upload an image"));
    }
    cb(undefined, true);
  },
});

async function unlinkImage(imgUrl){
  if(imageUrl !== "CompanyDefalultImage"){
    try{
      await unlinkAsync(imgUrl)
    } catch(ex){
      console.log(ex)
    }
  }
}

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
  async (req, res) => {
    const { companyName, email, password, password2 } = req.body;
    imageUrl = "CompanyDefalultImage";
    if (req.file) {
      imageUrl = req.file.filename;
    }
    let errors = [];
    if (!req.file) {
      errors.push({ msg: "Please provide an image" });
    }
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
      await unlinkImage(imageUrl);
      return res.render("register", {
        errors,
        companyName,
        email,
        password,
        password2,
      });
    }
    //Validation
    const company = await Company.findOne({ email: email });
    if (company) {
      //user exist
      errors.push({ msg: "Company is already registered" });
      return res.render("register", {
        errors,
        companyName,
        email,
        password,
        password2,
      });
    }
    const newCompany = new Company({
      companyName,
      email,
      password,
      imageUrl,
    });
    const salt = await bcrypt.genSalt(10);
    newCompany.password = await bcrypt.hash(newCompany.password, salt);
    const newAccount = new Account({ owner: newCompany._id });
    try {
      new Fawn.Task()
        .save("companies", newCompany)
        .save("accounts", newAccount)
        .run();
        req.flash("success_msg", "You are now registered and can log in");
        res.redirect("/users/login");  
    } catch (ex) {
      await unlinkImage(imageUrl);
      errors.push({ msg: "Somthing fail, try again later" });
      return res.render("register", {
        errors,
        companyName,
        email,
        password,
        password2,
      });
    }
    //
  },
  (error, req, res, next) => {
    const { companyName, email, password, password2 } = req.body;
    let errors = [];
    errors.push({ msg: error.message });
    res.render("register", {
      errors,
      companyName,
      email,
      password,
      password2,
    });
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
