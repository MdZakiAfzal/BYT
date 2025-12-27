const Job = require('../models/jobModel');
const User = require('../models/userModel');
const plans = require('../config/plans');
const queueService = require('../services/queueService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// Helper to extract Video ID from URL
const extractVideoId = (url) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

exports.createJob = catchAsync(async (req, res, next) => {
  const { youtubeUrl } = req.body;
  const user = req.user; // From protect middleware

  // 1. Validate Input
  const videoId = extractVideoId(youtubeUrl);
  if (!videoId) {
    return next(new AppError('Invalid YouTube URL', 400));
  }

  // 2. CHECK QUOTA (The Business Logic)
  const userPlan = plans[user.plan];
  
  if (user.monthlyQuotaUsed >= userPlan.monthlyQuota) {
    return next(new AppError(`Monthly quota exceeded for ${userPlan.name} plan. Please upgrade!`, 403));
  }

  // 3. Create Job in DB (Status: queued)
  const newJob = await Job.create({
    userId: user._id,
    youtubeUrl,
    videoId,
    status: 'queued',
    attemptNumber: user.monthlyQuotaUsed + 1
  });

  // 4. Add to Redis Queue (Async)
  await queueService.addJob({ 
    jobId: newJob._id.toString(),
    youtubeUrl: newJob.youtubeUrl
  });

  // 5. Increment User Usage
  // We use $inc to atomically increase the counter
  await User.findByIdAndUpdate(user._id, { $inc: { monthlyQuotaUsed: 1 } });

  res.status(201).json({
    status: 'success',
    data: { job: newJob }
  });
});

exports.getAllJobs = catchAsync(async (req, res, next) => {
  const jobs = await Job.find({ userId: req.user._id }).sort('-createdAt');
  
  res.status(200).json({
    status: 'success',
    results: jobs.length,
    data: { jobs }
  });
});

// 3. Get Single Job
exports.getJob = catchAsync(async (req, res, next) => {
  // We explicitly check userId to ensure users can't snoop on others' jobs
  const job = await Job.findOne({ 
    _id: req.params.id, 
    userId: req.user._id 
  }).select('+generatedBlog');

  if (!job) {
    return next(new AppError('Job not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { job }
  });
});

// 4. Manual Retry Job
exports.retryJob = catchAsync(async (req, res, next) => {
  const job = await Job.findOne({ 
    _id: req.params.id, 
    userId: req.user._id 
  });

  if (!job) {
    return next(new AppError('Job not found', 404));
  }

  // Only allow retrying if it actually failed
  if (job.status !== 'failed') {
    return next(new AppError('You can only retry failed jobs', 400));
  }

  // 1. Reset Status
  job.status = 'queued';
  job.failedReason = undefined; // Clear error
  job.attemptNumber += 1; // Track that we tried again
  await job.save();

  // 2. Re-add to Redis
  await queueService.addJob({ 
    jobId: job._id.toString(),
    youtubeUrl: job.youtubeUrl
  });

  res.status(200).json({
    status: 'success',
    message: 'Job has been re-queued',
    data: { job }
  });
});

// 5. Update/Save Job Content (For the "Edit & Save" feature)
exports.updateJobContent = catchAsync(async (req, res, next) => {
  const job = await Job.findOne({ _id: req.params.id, userId: req.user._id });

  if (!job) {
    return next(new AppError('Job not found or not owned by you', 404));
  }

  // Allow updating blog, socials, etc.
  if (req.body.generatedBlog) job.generatedBlog = req.body.generatedBlog;
  if (req.body.generatedSocials) job.generatedSocials = req.body.generatedSocials;

  await job.save();

  res.status(200).json({
    status: 'success',
    data: { job }
  });
});

// 6. Toggle Public Status (For the "Share" button)
exports.togglePublicStatus = catchAsync(async (req, res, next) => {
  const job = await Job.findOne({ _id: req.params.id, userId: req.user._id });

  if (!job) {
    return next(new AppError('Job not found', 404));
  }

  // Toggle true/false
  job.isPublic = !job.isPublic;
  await job.save();

  res.status(200).json({
    status: 'success',
    data: { 
      isPublic: job.isPublic,
      publicUrl: job.isPublic ? `/share/${job._id}` : null 
    }
  });
});

// 7. Get Public Job (For the generic "Viewer" page - NO AUTH REQUIRED)
exports.getPublicJob = catchAsync(async (req, res, next) => {
  // We do NOT check req.user here because the viewer is a stranger
  const job = await Job.findById(req.params.id).select('+generatedBlog');

  // Security Check: Only show if the owner marked it as public
  if (!job || !job.isPublic) {
    return next(new AppError('This page is private or does not exist.', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { job }
  });
});