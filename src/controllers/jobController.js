const Job = require('../models/jobModel');
const User = require('../models/userModel');
const plans = require('../config/plans');
const queueService = require('../services/queueService');
const aiService = require('../services/aiService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { GoogleGenAI } = require("@google/genai");

// Helper to extract Video ID from URL
const extractVideoId = (url) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

exports.createJob = catchAsync(async (req, res, next) => {
  const { youtubeUrl, tone, perspective, length } = req.body;
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

  const requestedLength = length || 'short';
  if (!userPlan.features.allowedLengths.includes(requestedLength)) {
    // If they ask for 'long' but are on Free, force 'short' or error
    return next(new AppError(`The '${requestedLength}' length is not available on your plan.`, 403));
  }

  // If they send custom tone but plan doesn't allow it, revert to default
  const finalTone = userPlan.features.toneControls ? (tone || 'professional') : 'professional';
  const finalPerspective = userPlan.features.toneControls ? (perspective || 'first') : 'first';

  // 3. Create Job in DB (Status: queued)
  const newJob = await Job.create({
    userId: user._id,
    youtubeUrl,
    videoId,
    status: 'queued',
    attemptNumber: user.monthlyQuotaUsed + 1,
    options: {
      tone: finalTone,
      perspective: finalPerspective,
      length: requestedLength
    }
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

// 🆕 8. Delete Job
exports.deleteJob = catchAsync(async (req, res, next) => {
  // Check userId to ensure they only delete their own jobs
  const job = await Job.findOneAndDelete({ 
    _id: req.params.id, 
    userId: req.user._id 
  });

  if (!job) {
    return next(new AppError('Job not found or not owned by you', 404));
  }

  // We send 204 (No Content) which is standard for deletions
  res.status(204).json({
    status: 'success',
    data: null
  });
});

// 🆕 9. CHAT WITH JOB (The Co-Pilot)
exports.chatWithJob = catchAsync(async (req, res, next) => {
  const { message, selectedText } = req.body;
  
  // 1. Get Job & Verify Ownership
  const job = await Job.findOne({ _id: req.params.id, userId: req.user._id });
  if (!job) return next(new AppError('Job not found', 404));

  // 2. 🛡️ CHECK PLAN PERMISSION
  const user = req.user;
  const userPlan = plans[user.plan];

  if (!userPlan.features.chatAssistant) {
    return next(new AppError('The AI Co-Pilot is a premium feature. Please upgrade to use it.', 403));
  }

  // 3. Call AI Service
  const rewrittenText = await aiService.chatWithContent(
    { videoTitle: job.videoMetadata.title },
    message,      // e.g., "Make it funnier"
    selectedText  // The text user highlighted
  );

  // 3. Return the suggestion
  res.status(200).json({
    status: 'success',
    data: { rewrittenText }
  });
});

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY 
});

exports.generateImage = catchAsync(async (req, res, next) => {
  const { prompt } = req.body;

  // 1. 🔍 Get User & Plan
  const user = await User.findById(req.user._id);
  if (!user) return next(new AppError('User not found', 404));

  const userPlan = plans[user.plan] || plans.free;

  // 2. 🛡️ Permission Gates
  if (!userPlan.features.allowImageGen) {
    return next(new AppError('AI Image Generation is a premium feature. Please upgrade.', 403));
  }

  const imageLimit = userPlan.features.imageQuota;
  if (user.imageQuotaUsed >= imageLimit) {
    return next(new AppError(`You have reached your limit of ${imageLimit} images.`, 403));
  }

  if (!prompt) {
    return next(new AppError('Please provide an image description', 400));
  }

  // 3. 🎨 Generate Image
  let imageUrl = "";
  let generationSource = "gemini";

  try {
    // Clean prompt: limit length and remove line breaks for the model
    const cleanPrompt = prompt.substring(0, 500).replace(/(\r\n|\n|\r)/gm, " ");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [{ role: "user", parts: [{ text: cleanPrompt }] }],
      config: {
        response_modalities: ["IMAGE"],
        image_config: {
          aspect_ratio: "1:1",
          count: 1
        }
      }
    });

    // Extract Base64 from the 2026 SDK response structure
    const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

    if (imagePart) {
      const { data, mimeType } = imagePart.inlineData;
      imageUrl = `data:${mimeType};base64,${data}`;
    } else {
      throw new Error("Empty image payload from Gemini");
    }

  } catch (err) {
    console.warn("⚠️ Gemini 2.5 Image failed, falling back to Flux:", err.message);
    
    // STRATEGY B: Fallback (Pollinations Flux)
    generationSource = "flux";
    const safePrompt = encodeURIComponent(
      prompt.substring(0, 150).replace(/[^\w\s]/gi, '')
    );
    imageUrl = `https://image.pollinations.ai/prompt/${safePrompt}?width=1024&height=1024&model=flux&nologo=true`;
  }

  // 4. 📈 Increment Quota & Send Response
  // Use { new: true } to get the updated count for the response
  const updatedUser = await User.findByIdAndUpdate(
    user._id,
    { $inc: { imageQuotaUsed: 1 } },
    { new: true }
  );

  res.status(200).json({
    status: 'success',
    source: generationSource,
    data: {
      imageUrl: imageUrl,
      quotaRemaining: Math.max(0, imageLimit - updatedUser.imageQuotaUsed)
    }
  });
});