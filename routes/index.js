const express = require("express");
const router = express.Router();
const { ensureAuth } = require("../config/auth");
const Trip = require("../models/Trip");
const Reservations = require("../models/Reservation");
const { ReservationComp } = require("../models/ReservationComp");
const Account = require("../models/Account");
const Payment = require("../models/Payment");
const moment = require("moment");

router.get("/", (req, res) => {
  res.render("home", {layout: false});
});

router.get("/about", (req, res) => {
  res.render("about", {layout: false});
});

router.get("/dashboard", ensureAuth, async (req, res) => {
  const { p = 1, limit = 10 } = req.query;
  const trips = await Trip.find({ company: req.user._id })
    .limit(limit * 1)
    .skip((p - 1) * limit)
    .lean()
    .exec();

  tripsIdes = trips.map((it) => it._id);
  const reservations = await Reservations.find({ trip: tripsIdes[0] }).populate(
    "payment",
    "amount createdAt -_id",
    Payment
  );

  const companyAccount = await Account.findOne({ owner: req.user._id });
  const totalPayments = companyAccount.total;
  const inAccount = companyAccount.inAccount;
  const internalPayments = companyAccount.internalPayments;

  let last30DaysPayments = reservations
    .filter((it) =>
      moment(it.payment.createdAt).isAfter(moment().subtract(30, "days"))
    )
    .map((it) => it.payment.amount)
    .reduce((a, b) => (a += parseFloat(b)), 0);

  const count = await Trip.find({
    company: req.user._id,
  }).countDocuments();

  if (!trips || !count) {
    return res.render("dashboard", {
      image: req.user.imageUrl,
      totalPayments,
      inAccount,
      internalPayments,
      last30DaysPayments,
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
    totalPayments,
    inAccount,
    internalPayments,
    last30DaysPayments,
    pagination: {
      page: p,
      pageCount: count === 0 ? 1 : Math.ceil(count / limit),
    },
  });
});

module.exports = router;
