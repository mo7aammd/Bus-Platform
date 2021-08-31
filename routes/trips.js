const express = require("express");
const router = express.Router();
const Trip = require("../models/Trip");
const Reservation = require("../models/Reservation");
const { ensureAuth, ensureEnabled } = require("../config/auth");
const validObjectId = require("../models/validateObjectId");
const moment = require('moment');
const { firebase } = require('../config/firebase');

const cities = [
  { name: "Mukalla" }, 
  { name: "Aden" }, 
  { name: "Sanaa" },
  { name: "Sayyuwn" },
  { name: "Alghyzh" },
  { name: "Taiz" },
  { name: "Dhamar" },
  { name: "Al Hudaydah" },
];
const seatTypes = [{ name: 50 }, { name: 55 }, { name: 60 }];

//GET trips/add
router.get("/add", ensureAuth, ensureEnabled, (req, res) => {
  res.render("trips/add", {
    image:req.user.imageUrl,
    cities: cities,
    seatTypes,
    from: "Mukalla",
    to: "Mukalla",
    seats: 50
  });
});

//POST trips/add
router.post("/add", ensureAuth, ensureEnabled, (req, res) => {
  const { from, to, price, seats, tripdatetime } = req.body;
  const company = req.user._id;
  let errors = [];
  if (!from || !to || !price || !seats || !tripdatetime) {
    errors.push({ msg: "Please enter all fields" });
  }

  if (from === to) {
    errors.push({ msg: "Two cities are the same, Please change one" });
  }

  if(moment(tripdatetime).isBefore(Date.now())){
    errors.push({ msg: "The time is passed" });
  }

  if (errors.length > 0) {
    res.render("trips/add", {
      image:req.user.imageUrl,
      errors,
      cities,
      seatTypes,
      from,
      to,
      price,
      seats,
      tripdatetime,
    });
  } else {
    const newTrip = new Trip({
      company,
      from,
      to,
      date: tripdatetime,
      price,
      seatsCount: [ 0, seats]
    });
    newTrip
      .save()
      .then((trip) => {
        req.flash(
          "success_msg",
          `New trip added ${from} ==> ${to} $${price} Seats: ${seats} [${new Date(
            tripdatetime
          ).toLocaleString("en-US")}]`
        );
        res.redirect("/trips/add");
      })
      .catch((err) => {
        console.log(err);
        req.flash("error_msg", `Error ocours, please try again`);
        res.redirect("/trips/add");
      });
  }
});
//GET trips/edit
router.get("/edit/:id", ensureAuth, ensureEnabled, async (req, res) => {
  const tripId = req.params.id;
  const company = req.user._id;
  if (!validObjectId(tripId)) return res.render("error",{
    layout: false,
    msg: 'Invalid Trip ID!'
  });
  const trip = await Trip.findOne({
    _id: tripId,
    company,
  }).lean();
  if (!trip) {
    req.flash("error_msg", "Trip not found");
    return res.redirect("/dashboard");
  }
  res.render("trips/edit", {
    image:req.user.imageUrl,
    cities,
    seatTypes,
    tripId: trip._id,
    from: trip.from,
    to: trip.to,
    price: trip.price,
    seats: trip.seatsCount[1],
    tripdatetime: moment(trip.date).format('YYYY-MM-DDThh:mm'),
  });
});
//PUT trips/edit
router.put("/edit", ensureAuth, ensureEnabled, async (req, res) => {
  const company = req.user._id;
  const { tripId, from, to, price, seats, tripdatetime } = req.body;
  let errors = [];

  if (!tripId) {
    req.flash("error_msg", "Trip not found");
    return res.redirect("/dashboard");
  }

  if (!from || !to || !price || !seats || !tripdatetime) {
    errors.push({ msg: "Please enter all fields" });
  }

  if (from === to) {
    errors.push({ msg: "Two cities are the same, Please change one" });
  }

  if(moment(tripdatetime).isBefore(Date.now())){
    errors.push({ msg: "The time is passed" });
  }

  if (errors.length > 0) {
    res.render("trips/edit", {
      image:req.user.imageUrl,
      errors,
      cities,
      seatTypes,
      tripId,
      from,
      to,
      price,
      seats,
      tripdatetime: moment(tripdatetime).format('YYYY-MM-DDThh:mm'),
    });
  } else {
    const trip = await Trip.findOne({
      _id: tripId,
      company,
    });
    if (!trip) {
      req.flash("error_msg", "Trip not found");
      return res.redirect("/dashboard");
    }
    trip.from = from;
    trip.to = to;
    trip.price = price;
    trip.seatsCount = [ trip.seatsCount[0], seats];
    const oldTripDate = trip.date;
    trip.date = tripdatetime;
    const result = await trip.save();
    if (!result) {
      errors.push({ msg: "Trip not edited try again" });
      res.render("trips/edit", {
        image:req.user.imageUrl,
        errors,
        cities,
        seatTypes,
        tripId,
        from,
        to,
        price,
        seats,
        tripdatetime: moment(tripdatetime).format('YYYY-MM-DDThh:mm'),
      });
    } else {
        console.log('----')
        const reservations = await Reservation.find({ trip: trip.id })
          .select('customer -_id')
          .populate({
            path: 'customer',
            select: 'firebaseToken -_id',
          })
          .lean();

          const tokens = reservations
          .map (r => r = r.customer.firebaseToken)
          .filter(r => (typeof r === 'string' && r !== '') );

          const tokenSet = new Set();
          tokens.forEach(r => tokenSet.add(r));
          if(tokenSet.size > 0){
          console.log(tokenSet);
          notificationMsg = `Your Reservation from ${trip.from} to ${trip.to} has changes Dates to ${moment(tripdatetime).format('YYYY-MM-DD hh:mm A')}`;
          sendNodtification(notificationMsg, tokens);
      
    }
      req.flash("success_msg", "Trip successfully edited");
      res.redirect("/dashboard");
    }
  }
});
async function sendNodtification(Message, token){
  
  const message = {
    data: {
      message: Message,
      title: 'Trip Status Changed!'
    },
    tokens: token
  };
  
  // Send a message to the device corresponding to the provided
  // registration token.
  firebase.messaging().sendMulticast(message)
    .then((response) => {
    })
    .catch((error) => {
      console.log('Error sending message:', error);
    });

}
module.exports = router;