const express = require('express');
const jobController = require('../controllers/jobController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router.post('/', jobController.createJob);
router.get('/', jobController.getAllJobs);
router.get('/:id', jobController.getJob);
router.post('/:id/retry', jobController.retryJob);

module.exports = router;