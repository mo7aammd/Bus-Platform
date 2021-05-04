const express = require("express");
const router = express.Router();
const Trip = require("../models/Trip");
const Company = require("../models/Company");
const Reservation = require("../models/Reservation");
const Payment = require("../models/Payment");
var Fawn = require("Fawn");
const { auth } = require('../config/authJWT');
const { Transaction } = require('braintree');
const gateway = require('../config/gateway');

const TRANSACTION_SUCCESS_STATUSES = [
  Transaction.Status.Authorizing,
  Transaction.Status.Authorized,
  Transaction.Status.Settled,
  Transaction.Status.Settling,
  Transaction.Status.SettlementConfirmed,
  Transaction.Status.SettlementPending,
  Transaction.Status.SubmittedForSettlement,
];

router.get("/", auth, async (req, res) => {

  const reservations = await Reservation.find({
    customer: req.user._id
  })
  .select('seats')
  .populate({
    path: 'trip',
    select: 'company from to date -_id',
    model: Trip,
    populate: {
      path: 'company',
      select: 'imageUrl -_id',
      model: Company
    }
  });

  res.send({bookings:reservations});
  
});

router.get('/checkouts/new' ,auth ,(req, res) => {
  gateway.clientToken.generate({}).then(({ clientToken }) => {
    const token = {
      token:clientToken
    }
    res.send(JSON.stringify(token))
  });
});

router.post('/reserve' , auth, async(req, res) => {
  // In production you should not take amounts directly from clients
  const { amount, payment_method_nonce: paymentMethodNonce, tripId, ticketCount } = req.body;

  gateway.transaction
    .sale({
      amount,
      paymentMethodNonce,
      options: { submitForSettlement: true },
    })
    .then((result) => {
      const { success, transaction } = result;
      return new Promise(async (resolve, reject) => {
        if (success || transaction) {
          //res.redirect(`checkouts/${transaction.id}`);
          var trip = await Trip.findOne({_id: tripId});
          if(!trip){
            reject(result);
            return res.json("Trip not found")
          }
          avalibaleSeats = trip.seatsCount[1] - trip.seatsCount[0];
          if(avalibaleSeats < ticketCount){
            reject(result);
            return res.json(`only ${avalibaleSeats} seats are avaliable`)
          }
          var payment = new Payment({
            from: req.user._id,
            to: trip._id,
            amount: transaction.amount
          });
          var reservation = new Reservation({
            trip: tripId,
            customer: req.user._id,
            payment: payment._id,
            seats: ticketCount
          })
          try{
            new Fawn.Task()
              .save('payments', payment)
              .save('reservations', reservation)
              .update("trips", {_id: trip._id}, {
                $inc: {'seatsCount.0': parseInt(ticketCount)}
              })
              .run();
            res.json({
              message: "Reserve Trip Sucessfully"
            });
            resolve();
        } catch(ex){
          reject(result);
          res.status(500).send("Somthing went wrong!")
        }
        }
        reject(result);
      });
    })
    .catch(({ errors }) => {
      const deepErrors = errors.deepErrors();
      res.send(formatErrors(deepErrors))
    });
});

function formatErrors(errors) {
  let formattedErrors = '';

  for (let [, { code, message }] of Object.entries(errors)) {
    formattedErrors += `Error: ${code}: ${message}`;
  }

  return formattedErrors;
}

module.exports = router;
