const express = require('express');
const Waitlist = require('../models/waitlistModel');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    // 1. Create the entry
    const newEntry = await Waitlist.create({
      email: req.body.email,
      ipAddress: req.ip // Express automatically gets the IP
    });

    res.status(201).json({
      status: 'success',
      message: 'You have been added to the waitlist!',
      data: { email: newEntry.email }
    });

  } catch (err) {
    // Handle duplicate email error (MongoDB code 11000)
    if (err.code === 11000) {
      return res.status(409).json({
        status: 'fail',
        message: 'You are already on the waitlist!'
      });
    }
    
    // Handle validation error
    res.status(400).json({
      status: 'error',
      message: err.message
    });
  }
});

module.exports = router;