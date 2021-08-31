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
const { ensureAuth, ensureEnabled } = require("../config/auth");
const validObjectId = require("../models/validateObjectId");
const moment = require("moment");

//Reservations List Page for specific ID trip
router.get("/:id", ensureAuth, async (req, res) => {
  const { p = 1, limit = 10 } = req.query;
  const tripId = req.params.id;
  if (!validObjectId(tripId)) return res.render("error",{
    layout: false,
    msg: 'Invalid Reservations query ID!'
  });

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
  if (!validObjectId(tripId)) return res.render("error",{
    layout: false,
    msg: 'Invalid Reservation query ID!'
  });

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
router.get("/new/:id", ensureAuth, ensureEnabled, async (req, res) => {
  const tripId = req.params.id;
  if (!validObjectId(tripId)) return res.render("error",{
    layout: false,
    msg: 'Invalid Trip ID!'
  });;

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
router.post("/:id", ensureAuth, ensureEnabled, async (req, res) => {
  const tripId = req.params.id;
  const { customerName, phone, seats } = req.body;
  let errors = [];
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

  if(moment(trip.date).isBefore(Date.now())){
    errors.push({ msg: "The trip time has passed" });
  }
  const { error } = validateReservationComp(
    {
      customerName,
      phone,
      seats,
    },
    avaliableSeats
  );
  if(error)  errors.push({ msg: error.details[0].message });
  if (errors.length > 0) {
    return res.render("reservations/new", {
      errors,
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
            internalPayments: reservation.amount,
          },
        }
      )
      .run();
  } catch (ex) {
    req.flash("error_msg", `Reservation doesn't Complete`);
    return res.redirect("/reservations/new/" + tripId);
  }
  req.flash("success_msg", `Reservation Success`);
  res.redirect("/reservations/comp/" + tripId);
});
//display to generate reservation document
router.get('/generateview/:id', ensureAuth, async(req, res) => {
  const reservationId = req.params.id;
  if (!validObjectId(reservationId)) return res.render("error",{
    layout: false,
    msg: 'Invalid Reservation ID!'
  });;
  res.render('reservations/generate', {
    layout: false,
    id: reservationId
  });
});
//generate reservation document
router.get('/generate/:id', ensureAuth, async(req, res) => {
  const reservationId = req.params.id;
  if (!validObjectId(reservationId)) return res.render("error",{
    layout: false,
    msg: 'Invalid Reservation ID!'
  });;

  const reservation = await ReservationComp.findById(reservationId)
    .populate({
      path: 'trip',
      select: 'company from to date -_id',
      model: Trip,
      populate: {
        path: 'company',
        select: 'companyName -_id'
      }
    })
    .lean();

    if(!reservation) return res.render("error",{
      layout: false,
      msg: 'Invalid Reservation ID!'
    });;


    var fonts = {
      Roboto: {
        normal: 'fonts/Roboto-Regular.ttf',
        bold: 'fonts/Roboto-Medium.ttf',
        italics: 'fonts/Roboto-Italic.ttf',
        bolditalics: 'fonts/Roboto-MediumItalic.ttf'
      }
    };

    var PdfPrinter = require('pdfmake');
    var printer = new PdfPrinter(fonts);
    var fs = require('fs');

    var docDefinition = {
      content: [
          { text: 'Transport Bus platform', style: 'header' },
          { text: `${reservation.trip.company.companyName}`, fontSize: 18,  bold: true, alignment: 'center' },
          { text: `ID: ${reservation._id}`, fontSize: 15,  bold: true, alignment: 'left' },
          { text: `${reservation.trip.from} ==> ${reservation.trip.to}`, fontSize: 15,  bold: true, alignment: 'left' },
          { text: `${moment(reservation.trip.date).format('YYYY/MM/DD hh:mm A')}`, fontSize: 15,  bold: true, alignment: 'left' },
          { text: `Seats: ${reservation.seats}`, fontSize: 15,  bold: true, alignment: 'left' },
          { qr: `http://localhost:3000/reservations/verifyCom/${reservation._id}`, alignment: 'right'},
      ],
      styles: {
        header: {
          fontSize: 22,
          bold: true,
          alignment: 'center'
        }
      }
    };
    var doc = printer.createPdfKitDocument(docDefinition);
    var chunks = [];
    var result;

    doc.on('data', function (chunk) {
      chunks.push(chunk)
    });
    doc.on('end', function () {
      result = Buffer.concat(chunks)

      res.contentType('application/pdf')
      res.send(result)
    });
    doc.end()
})

//Reservation verify
router.get("/verify/:id", async (req, res) => {
  const reservationId = req.params.id;
  if (!validObjectId(reservationId))return res.render("error",{
    layout: false,
    msg: 'Invalid Reservation ID!'
  });;

  const reservation = await Reservations.findOne({ _id: reservationId })
    .select("seats")
    .populate("customer", "name -_id")
    .populate("payment", "amount -_id", Payment)
    .populate({
      path: "trip",
      select: "company from to date -_id",
      model: Trip,
      populate: {
        path: "company",
        select: "companyName imageUrl -_id",
      },
    })
    .lean();

  reservation.trip.date = moment(reservation.trip.date).format("LLLL");

  if(!reservation) return res.send("Resevation Not exist");
  res.render("reservations/verify", {
    reservation
  });
});
//Reservation By Company verify
router.get("/verifyCom/:id", async (req, res) => {
  const reservationId = req.params.id;
  if (!validObjectId(reservationId))return res.render("error",{
    layout: false,
    msg: 'Invalid Reservation ID!'
  });;

  const reservation = await ReservationComp.findOne({ _id: reservationId })
    .populate({
      path: 'trip',
      select: 'company from to date -_id',
      model: Trip,
      populate: {
        path: 'company',
        select: 'companyName imageUrl -_id'
      }
    })
    .lean();

  reservation.trip.date = moment(reservation.trip.date).format("LLLL");

  if(!reservation) return res.send("Resevation Not exist");
  res.render("reservations/verifycom", {
    reservation
  });
});
module.exports = router;
