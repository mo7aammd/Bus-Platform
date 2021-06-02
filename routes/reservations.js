const express = require("express");
const router = express.Router();
var Fawn = require("Fawn");
const Trip = require("../models/Trip");
const Payment = require("../models/Payment");
const Reservations = require("../models/Reservation");
const {
  ReservationComp,
  validateReservationComp,
} = require("../models/ReservationComp");
const { ensureAuth } = require("../config/auth");
const validObjectId = require("../models/validateObjectId");

//Reservations List Page for specific ID trip
router.get("/:id", ensureAuth, async (req, res) => {
  const { p = 1, limit = 10 } = req.query;
  const tripId = req.params.id;
  if (!validObjectId(tripId)) return res.status(400).send("Bad Request");

  const trip = await Trip.findOne({ _id: tripId });
  if (!trip) return res.status(400).send("Trip Not Found");
  if (trip.company.toString() !== req.user._id.toString())
    return res.status(401).send("Unauthorized");

  const reservations = await Reservations.find({ trip: tripId })
    .populate("trip", "from to date -_id", Trip)
    .populate("customer", "name -_id")
    .populate("payment", "amount -_id", Payment)
    .limit(limit * 1)
    .skip((p - 1) * limit)
    .lean()
    .exec();

  const count = await Reservations.find({ trip: tripId }).countDocuments();

  if (!reservations || !count) {
    return res.render("reservations/reservations", {
      image: req.user.imageUrl,
      tripId,
      pagination: {
        page: p,
        pageCount: count === 0 ? 1 : Math.ceil(count / limit),
      },
    });
  }

  reservations.forEach(
    (it) => (it.createdAt = new Date(it.createdAt).toLocaleString("en-US"))
  );

  res.render("reservations/reservations", {
    image: req.user.imageUrl,
    reservations,
    tripId,
    pagination: {
      page: p,
      pageCount: count === 0 ? 1 : Math.ceil(count / limit),
    },
  });
});

//Reservations by Company List Page for specific ID trip
router.get("/comp/:id", ensureAuth, async (req, res) => {
  const { p = 1, limit = 10 } = req.query;
  const tripId = req.params.id;
  if (!validObjectId(tripId)) return res.status(400).send("Bad Request");

  const trip = await Trip.findOne({ _id: tripId });
  if (!trip) return res.status(400).send("Trip Not Found");
  if (trip.company.toString() !== req.user._id.toString())
    return res.status(401).send("Unauthorized");

  const reservations = await ReservationComp.find({ trip: tripId })
    .populate("trip", "from to date -_id", Trip)
    .limit(limit * 1)
    .skip((p - 1) * limit)
    .lean()
    .exec();

  const count = await ReservationComp.find({ trip: tripId }).countDocuments();

  if (!reservations || !count) {
    return res.render("reservations/reservationsComp", {
      image: req.user.imageUrl,
      tripId,
      pagination: {
        page: p,
        pageCount: count === 0 ? 1 : Math.ceil(count / limit),
      },
    });
  }

  reservations.forEach(
    (it) => (it.createdAt = new Date(it.createdAt).toLocaleString("en-US"))
  );

  res.render("reservations/reservationsComp", {
    image: req.user.imageUrl,
    reservations,
    tripId,
    pagination: {
      page: p,
      pageCount: count === 0 ? 1 : Math.ceil(count / limit),
    },
  });
});

//Reservation New Page for specific ID trip
router.get("/new/:id", ensureAuth, async (req, res) => {
  const tripId = req.params.id;
  if (!validObjectId(tripId)) return res.status(400).send("Bad Request");

  const trip = await Trip.findOne({ _id: tripId });
  if (!trip) {
    req.flash("error_msg", `Trip not Found`);
    res.redirect("/reservations/" + tripId);
  }

  const avaliableSeats = trip.seatsCount[1] - trip.seatsCount[0];
  if (avaliableSeats <= 0) {
    req.flash("error_msg", `Trip is Full`);
    res.redirect("/reservations/" + tripId);
  }
  res.render("reservations/new", {
    image: req.user.imageUrl,
    tripId,
    avaliableSeats,
    price: trip.price,
    seats: 1,
  });
});

//Reservation handler
router.post("/:id", ensureAuth, async (req, res) => {
  const tripId = req.params.id;
  const { customerName, phone, seats } = req.body;
  if (!validObjectId(tripId)) return res.status(400).send("Bad Request");

  const trip = await Trip.findOne({ _id: tripId });
  if (!trip) {
    req.flash("error_msg", `Trip not Found`);
    res.redirect("/reservations/new/" + tripId);
  }

  const avaliableSeats = trip.seatsCount[1] - trip.seatsCount[0];
  if (avaliableSeats <= 0) {
    req.flash("error_msg", `Trip is Full`);
    res.redirect("/reservations/new/" + tripId);
  }

  const { error } = validateReservationComp(
    {
      customerName,
      phone,
      seats,
    },
    avaliableSeats
  );
  if (error) {
    return res.render("reservations/new", {
      errors: [{ msg: error.details[0].message }],
      image: req.user.imageUrl,
      tripId,
      avaliableSeats,
      price: trip.price,
      customerName,
      phone,
      seats,
    });
  }

  const reservation = new ReservationComp({
    trip: trip._id,
    customerName,
    phone,
    seats,
    amount: seats * trip.price,
  });
  try {
    new Fawn.Task()
      .save("reservationscomps", reservation)
      .update(
        "trips",
        { _id: trip._id },
        {
          $inc: { "seatsCount.0": parseInt(seats) },
        }
      )
      .update(
        "accounts",
        { owner: req.user._id },
        {
          $inc: { 
            total: reservation.amount, 
            internalPayments: reservation.amount 
          },
        }
      )
      .run();
  } catch (ex) {
    req.flash("error_msg", `Reservation doesn't Complete`);
    return res.redirect("/reservations/new/" + tripId);
  }
  req.flash("success_msg", `Reservation Success`);
  res.redirect("/reservations/" + tripId);
});
module.exports = router;
