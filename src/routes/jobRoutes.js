const express = require('express');
const jobController = require('../controllers/jobController');
const authController = require('../controllers/authController');

const router = express.Router();

// --- PUBLIC ROUTE 
router.get('/public/:id', jobController.getPublicJob); // Access a shared Blog

router.use(authController.protect);

router.route('/')
  .get(jobController.getAllJobs)
  .post(jobController.createJob);
router.route('/:id')
  .get(jobController.getJob)
  .patch(jobController.updateJobContent);
router.post('/:id/retry', jobController.retryJob);
router.patch('/:id/publish', jobController.togglePublicStatus);

module.exports = router;