const express = require("express");
const router = express.Router();
const { ensureAuth } = require("../config/auth");
const Trip = require("../models/Trip");
const Reservations = require("../models/Reservation");
const { ReservationComp } = require("../models/ReservationComp");
const Account = require("../models/Account");
const Payment = require("../models/Payment");
const moment = require("moment");

//GET Index
router.get("/", (req, res) => {
  res.render("home2", { layout: false });
});

//GET About
router.get("/about", (req, res) => {
  res.render("error", { layout: false });
});

//GET Dashboard
router.get("/dashboard", ensureAuth, async (req, res) => {
  const { p = 1, limit = 10, start, end } = req.query;
  let query, startDatepicker, endDatepicker;
  if (start && end) {
    query = {
      company: req.user._id,
      date: {
        $gte: moment(start, "YYYY-MM-DD").toDate(),
        $lt: moment(end, "YYYY-MM-DD").endOf("day").toDate(),
      },
    };
    startDatepicker = moment(start).format("YYYY-MM-DD");
    endDatepicker = moment(end).format("YYYY-MM-DD")

  } else query = { company: req.user._id };

  const trips = await Trip.find(query)
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

  let last30DaysPayments = reservations
    .filter((it) =>
      moment(it.payment.createdAt).isAfter(moment().subtract(30, "days"))
    )
    .map((it) => it.payment.amount)
    .reduce((a, b) => (a += parseFloat(b)), 0);

  const companyAccount = await Account.findOne({ owner: req.user._id });
  const totalPayments = companyAccount.total;
  const inAccount = companyAccount.inAccount;
  const internalPayments = companyAccount.internalPayments;

  const count = await Trip.find(query).countDocuments();

  if (!trips || !count) {
    return res.render("dashboard", {
      image: req.user.imageUrl,
      totalPayments,
      inAccount,
      internalPayments,
      last30DaysPayments,
      start,
      end,
      startDatepicker,
      endDatepicker,
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
    start,
    end,
    startDatepicker,
    endDatepicker,
    pagination: {
      page: p,
      pageCount: count === 0 ? 1 : Math.ceil(count / limit),
    },
  });
});

module.exports = router;
