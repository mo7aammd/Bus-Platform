const express = require("express");
const router = express.Router();
const Trip = require("../models/Trip");
const Reservation = require("../models/Reservation");

router.post("/:id", async (req, res) => {
  const { id } = req.params;
  const trip = await Trip.findOne({_id: id});
  if(!trip){
      return res.status(404).send("Trip not found");
  }
  if(trip.seatsCount[0] >= trip.seatsCount[1]){
    return res.status(401).send("Trip is full");
  }
  
});

module.exports = router;
