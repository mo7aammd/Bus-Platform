const Joi = require('joi');
var _ = require('lodash');
const express = require("express");
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcryptjs');
const { Customer, validate } = require('../models/Customer');
const { signToken } = require('../config/authJWT');
const multer = require("multer");
const path = require('path');
const fs = require("fs");
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);
const { auth } = require('../config/authJWT')


const storage = multer.diskStorage({
  destination: './public/profile/',
  filename: function(req, file, cb){
    cb(null,'custProfile-' + Date.now() + path.extname(file.originalname));
  }
});

// Init Upload
const upload = multer({
  storage: storage,
  limits:{fileSize: 1000000},
  fileFilter: function(req, file, cb) {
    if(file == undefined){
      return cb(new Error("Image not provide"));
    }
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Please upload an image"));
    }
    cb(undefined, true);
  }
});


router.post('/googletoken',
  passport.authenticate('google-id-token'),
  function (req, res) {
    // do something with req.user
    res.send(req.user? 200 : 401);
  }
);

router.post('/register', upload.single("file"), async function (req, res, next) {
  const { name, email, password, firebaseToken } = req.body;
  console.log(firebaseToken);
  imageUrl = "CustomerDefalultImage";
  if(req.file){
    imageUrl = req.file.filename;
  }
  const { error } = validate(req.body); 
  if (error) return res.status(400).send(error.details[0].message);

  let foundCustomer = await Customer.findOne({ email });
  if (foundCustomer) return res.status(403).send('Email is already in use!');
  
  const newCustomer = new Customer({ 
    name,
    email, 
    password,
    imageUrl,
    firebaseToken
  })
  const salt = await bcrypt.genSalt(10);
  newCustomer.password = await bcrypt.hash(newCustomer.password, salt);
  await newCustomer.save()

  const customer = await Customer.findOne({ email });
  if (!customer) return res.status(400).send('Registration did not complete');

  const user = _.pick(customer, ['name', 'email', 'imageUrl']);
  const token = signToken(customer);
  user.token = 'Bearer '+ token;
  res.status(200).json({user});

},(error, req, res, next) => {
  console.log(error);
});

router.post('/login', async (req, res)=>{
  const { email, password, firebaseToken } = req.body;

  const { error } = validateLogin(req.body); 
  if (error) return res.status(400).send(error.details[0].message);

  const foundCustomer = await Customer.findOne({ email });
  if (!foundCustomer) return res.status(400).send('Invalid Email or Password');

  //check firebase token
  if(foundCustomer.firebaseToken != firebaseToken){
    foundCustomer.firebaseToken = firebaseToken;
    foundCustomer.save();
  }

  const validPassword = await bcrypt.compare(password, foundCustomer.password);
  if(!validPassword) return res.status(400).send('Invalid Email or Password');

  const user = _.pick(foundCustomer, ['name', 'email', 'imageUrl']);
  const token = 'Bearer ' + signToken(foundCustomer);
  user.token = token;
  res.status(200).json({user});

})
router.post('/firebaseToken', auth, async(req, res) => {
  const { token } = req.body;
  const customer = await Customer.findById(req.user.id);
  if(customer){
    customer.firebaseToken = token;
    customer.save();
  }
  res.send();
});

router.get('/deleteFirebaseLogin', auth, async(req, res) => {
  const customer = await Customer.findById(req.user.id);
  if(customer){
    customer.firebaseToken = "";
    customer.save();
  }
  res.send();
});

router.get('/profile', auth, async(req, res) => {
  if(!req.user) return res.status(401).send('please login!');

  const foundCustomer = await Customer.findOne({ _id: req.user._id });
  if (!foundCustomer) return res.status(400).send('Cutomer not found');

  res.status(200).json(_.pick(foundCustomer, ['name', 'email', 'imageUrl']));
})

function validateLogin(req) {
  const schema = {
    email: Joi.string().min(5).max(255).required().email(),
    firebaseToken: Joi.string(),
    password: Joi.string().min(5).max(255).required()
  };

  return Joi.validate(req, schema);
}

module.exports = router;