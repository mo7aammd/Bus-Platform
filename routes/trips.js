const express = require("express");
const router = express.Router();
const Trip = require("../models/Trip");
const { ensureAuth } = require("../config/auth");
const moment = require('moment')

const cities = [{ name: "Mukalla" }, { name: "Aden" }, { name: "Sanaa" }];
const seatTypes = [{ name: 50 }, { name: 55 }, { name: 60 }];

//GET trips/add
router.get("/add", ensureAuth, (req, res) => {
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
router.post("/add", ensureAuth, (req, res) => {
  const { from, to, price, seats, tripdatetime } = req.body;
  const companyId = req.user._id;
  let errors = [];
  if (!from || !to || !price || !seats || !tripdatetime) {
    errors.push({ msg: "Please enter all fields" });
  }

  if (from === to) {
    errors.push({ msg: "Two cities are the same, Please change one" });
  }

  if (errors.length > 0) {
    console.log(tripdatetime)
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
      companyId,
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
router.get("/edit/:id", ensureAuth, async (req, res) => {
  const tripId = req.params.id;
  const companyId = req.user._id;

  const trip = await Trip.findOne({
    _id: tripId,
    companyId: companyId,
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
router.put("/edit", ensureAuth, async (req, res) => {
  const companyId = req.user._id;
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

  if (errors.length > 0) {
    console.log(moment(tripdatetime).format('YYYY-MM-DDThh:mm'));
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
      companyId: companyId,
    });
    if (!trip) {
      req.flash("error_msg", "Trip not found");
      return res.redirect("/dashboard");
    }
    trip.from = from;
    trip.to = to;
    trip.price = price;
    trip.seatsCount = [ trip.seatsCount[0], seats];
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
      req.flash("success_msg", "Trip successfully edited");
      res.redirect("/dashboard");
    }
  }
});
module.exports = router;