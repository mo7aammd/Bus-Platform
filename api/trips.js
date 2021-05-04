const express = require("express");
const router = express.Router();
const Trip = require("../models/Trip");
const moment = require('moment')

router.get("/", async (req, res) => {
  const { from, to, start, end } = req.query;

  console.log(req.query)
  //ToDo parametr validation
  const avalibaleTrips = await Trip.find({ from, to, 
    date:{
      $gte: new Date(start), 
      $lt: moment(end, 'YYYY-MM-DD').endOf('day').toDate()
  } })
    .populate('company','companyName imageUrl -_id')
    .select('from to date seatsCount price');

  
  if (!avalibaleTrips) {
    return res.send();
  }

  res.send(JSON.stringify({trips:avalibaleTrips}));
});
router.get("/test", async (req, res) => {
  
  res.send(JSON.stringify({message:"hello"}));
});

module.exports = router;
