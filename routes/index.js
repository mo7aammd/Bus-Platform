const express = require("express");
const router = express.Router();
const { ensureAuth } = require("../config/auth");
const Trip = require("../models/Trip");

router.get("/", ensureAuth, (req, res) => {
  res.render("home", {
    image: req.user.imageUrl,
  });
});

router.get("/dashboard", ensureAuth, async (req, res) => {
  const { p = 1, limit = 10 } = req.query;

  const trips = await Trip.find({ companyId: req.user._id })
    .limit(limit * 1)
    .skip((p - 1) * limit)
    .lean()
    .exec();

  const count = await Trip.find({
    companyId: req.user._id,
  }).countDocuments();

  if (!trips || !count) {
    return res.render("dashboard", {
      image: req.user.imageUrl,
      pagination: {
        page: p,
        pageCount: count === 0 ? 1 : Math.ceil(count / limit),
      },
    });
  }

  trips.forEach(
    (trip) => (trip.date = new Date(trip.date).toLocaleString("en-US"))
  );
  res.render("dashboard", {
    image: req.user.imageUrl,
    trips: trips,
    pagination: {
      page: p,
      pageCount: count === 0 ? 1 : Math.ceil(count / limit),
    },
  });
});

module.exports = router;
