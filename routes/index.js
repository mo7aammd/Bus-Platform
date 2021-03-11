const express = require("express");
const router = express.Router();
const { ensureAuth } = require("../config/auth");
const Trip = require("../models/Trip");

router.get("/", ensureAuth, (req, res) => {
  res.render("home", {
    image: req.user.imageUrl,
  });
});

router.get("/dash", ensureAuth, async (req, res) => {
  const pageNumber = 1;
  const pageSize = 10;
  const { page = 1, limit = 10 } = req.query;

  let count = await Trip.find({
    companyId: req.user._id,
  }).countDocuments();

  count = count / pageSize;
  Trip.find({
    companyId: req.user._id,
  })
    .skip((pageNumber - 1) * pageSize)
    .limit(pageSize)
    .select({ from: 1, to: 1, date: 1 })
    .lean()
    .then((trips) => {
      //console.log(trips);
      trips.forEach(
        (trip) => (trip.date = new Date(trip.date).toLocaleString("en-US"))
      );
      res.render("dashboard", {
        image: req.user.imageUrl,
        trips: trips,
        count: count,
      });
    })
    .catch((err) => {
      res.render("dashboard", {
        image: req.user.imageUrl,
      });
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
        pageCount: Math.ceil(count / limit)
      }
  });
});

module.exports = router;
