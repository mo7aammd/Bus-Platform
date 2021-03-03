const express = require('express');
const router = express.Router();
const { ensureAuth} = require('../config/auth');
const Trip = require('../models/Trip');

router.get('/', ensureAuth, (req, res) => {
    res.render('home');
})

router.get('/dashboard', ensureAuth, async (req, res) => {
    const pageNumber = 1; 
    const pageSize = 10;
    
    let count = await Trip.find({
        companyId:req.user._id
    }).countDocuments();
    count = count/pageSize;
    Trip.find({
        companyId:req.user._id
    })
    .skip((pageNumber -1) * pageSize)
    .limit(pageSize)
    .select({ from:1, to:1, date:1})
    .lean()
    .then(trips =>{
        //console.log(trips);
        trips.forEach(trip => trip.date = new Date(trip.date).toLocaleString('en-US'));
        res.render('dashboard',{ 
            trips: trips,
            count: count});
    }).catch(err =>{
        res.render('dashboard');
    }); 
})

module.exports = router;