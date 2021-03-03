const express = require("express");
const router = express.Router();
const Trip = require("../models/Trip");
const { ensureAuth } = require("../config/auth");

const cities = [{ name: "Mukalla" }, { name: "Aden" }, { name: "Sanaa" }];

//GET trips/add
router.get("/add", ensureAuth, (req, res) => {
  res.render("trips/add", {
    cities: cities,
    from: "Mukalla",
    to: "Mukalla",
  });
});

//POST trips/add
router.post("/add", ensureAuth, (req, res) => {
  const { from, to, tripdatetime } = req.body;
  const companyId = req.user._id;
  let errors = [];

  if (!from || !to || !tripdatetime) {
    errors.push({ msg: "Please enter all fields" });
  }

  if (from === to) {
    errors.push({ msg: "Two cities are the same, Please change one" });
  }

  if (errors.length > 0) {
    res.render("trips/add", {
      errors,
      cities,
      from,
      to,
      tripdatetime,
    });
  } else {
    const newTrip = new Trip({
      companyId,
      from,
      to,
      date: tripdatetime,
    });
    newTrip
      .save()
      .then((trip) => {
        req.flash(
          "success_msg",
          `New trip added ${from} ==> ${to}, ${new Date(
            tripdatetime
          ).toLocaleString("en-US")}`
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
    cities,
    tripId: trip._id,
    from: trip.from,
    to: trip.to,
    tripdatetime: new Date(trip.date).getTime(),
  });
});
//PUT trips/edit
router.put("/edit", ensureAuth, async (req, res) => {
  const companyId = req.user._id;
  const { tripId, from, to, tripdatetime } = req.body;
  let errors = [];

  if (!tripId) {
    req.flash("error_msg", "Trip not found");
    return res.redirect("/dashboard");
  }

  if (!from || !to || !tripdatetime) {
    errors.push({ msg: "Please enter all fields" });
  }

  if (from === to) {
    errors.push({ msg: "Two cities are the same, Please change one" });
  }

  if (errors.length > 0) {
    res.render("trips/edit", {
      errors,
      cities,
      tripId,
      from,
      to,
      tripdatetime: new Date(tripdatetime).getTime(),
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
    trip.date = tripdatetime;
    const result = await trip.save();
    if (!result) {
      errors.push({ msg: "Trip not edited try again" });
      res.render("trips/edit", {
        errors,
        cities,
        tripId,
        from,
        to,
        tripdatetime: new Date(trip.date).getTime(),
      });
    } else {
      req.flash("success_msg", "Trip successfully edited");
      res.redirect("/dashboard");
    }
  }
});
module.exports = router;