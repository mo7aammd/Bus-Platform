const express = require("express");
const router = express.Router();
const Trip = require("../models/Trip");
const moment = require('moment');
const jwt = require('jsonwebtoken');
const { Customer } = require('../models/Customer');

//GET Avalible Trips
router.get("/", async (req, res) => {
  const { from, to, start, end } = req.query;

  if(!moment(start, 'YYYY-MM-DD').isSameOrAfter(moment().format('YYYY-MM-DD'))) return res.status(400).send("provided Date has passed");
  console.log(req.query)
  //ToDo parametr validation
  const avalibaleTrips = await Trip.find({ from, to, 
    date:{
      $gte: new Date(start), 
      $lt: moment(end, 'YYYY-MM-DD').endOf('day').toDate()
  } })
    .sort({ date: 1 })
    .populate('company','companyName imageUrl -_id')
    .select('from to date seatsCount price');

  console.log(avalibaleTrips);
  if (!avalibaleTrips) {
    return res.send();
  }
  if(req.headers.authorization){
    var token = req.headers.authorization;
    token = token.replace(/^Bearer\s+/, "");
    try {
      const userId = jwt.verify(token, process.env.JWT_SECRET).sub;
      const user = await Customer.findById(userId);
      if(user){
        return res.send(JSON.stringify({
          tripsData: {
          isEnabled: user.isEnabled,
          trips:avalibaleTrips}
        }));
      }
    } catch(err) {
    }
  }
  res.send(JSON.stringify({
    tripsData: {
    isEnabled: false,
    trips:avalibaleTrips}
  }));
});
router.get("/test", async (req, res) => {
  
  res.send(JSON.stringify({message:"hello"}));
});

module.exports = router;
