const express = require("express");
const router = express.Router();
const Trip = require("../models/Trip");
const Reservations = require("../models/Reservation");
const { ensureAuth } = require("../config/auth");

router.get("/:id", ensureAuth, async (req, res) => {
  const { p = 1, limit = 10 } = req.query;
  const tripId = req.params.id;

  const reservations = await Reservations.find({ tripId })
    .limit(limit * 1)
    .skip((p - 1) * limit)
    .lean()
    .exec();

  const count = await Reservations.find({ tripId }).countDocuments();

  if (!reservations  || !count) {
    return res.render("reservations/reservations", {
      image: req.user.imageUrl,
      pagination: {
        page: p,
        pageCount: count === 0 ? 1 : Math.ceil(count / limit),
      }
    });
  }

  reservations.forEach(
    (it) => (it.createdAt = new Date(it.createdAt).toLocaleString("en-US"))
  );

  res.render("reservations/reservations", {
    image: req.user.imageUrl,
    reservations,
    pagination: {
      page: p,
      pageCount: count === 0 ? 1 : Math.ceil(count / limit),
    },
  });
});

module.exports = router;
