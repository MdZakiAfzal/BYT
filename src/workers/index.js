const mongoose = require('mongoose');
require('dotenv').config();
const { Worker } = require('bullmq');
const connection = require('../config/redis');
const plans = require('../config/plans');
const User = require('../models/userModel');
const Job = require('../models/jobModel');
const transcriptService = require('../services/transcriptService');
const aiService = require('../services/aiService'); // 👈 The new Brain
const ytdl = require('@distube/ytdl-core'); // 👈 The Safety Check

// 1. Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('📦 Worker connected to MongoDB'))
  .catch(err => {
    console.error('❌ DB Error:', err);
    process.exit(1);
  });

// 2. The Job Processor
const processJob = async (job) => {
  const { jobId, youtubeUrl } = job.data;
  console.log(`\n🎬 [Job ${jobId}] Processing started...`);

  try {
    // A. Mark as Processing
    await Job.findByIdAndUpdate(jobId, { status: 'processing' });

    // B. Get Job & User Data
    const jobDoc = await Job.findById(jobId);
    if (!jobDoc) throw new Error('Job not found in DB');
    
    const user = await User.findById(jobDoc.userId);
    if (!user) throw new Error('User not found');

    const userPlan = plans[user.plan] || plans.free;

    // --- 🛡️ SAFETY CHECK: DURATION LIMIT ---
    console.log(`[Job ${jobId}] Checking duration...`);
    const info = await ytdl.getBasicInfo(youtubeUrl);
    const durationMins = Math.ceil(info.videoDetails.lengthSeconds / 60);
    const limit = userPlan.maxDuration;

    if (durationMins > limit) {
      throw new Error(`Video is ${durationMins} mins. Your plan limit is ${limit} mins.`);
    }

    // --- STEP 1: GET TRANSCRIPT ---
    let transcript = jobDoc.transcript;
    let videoId = jobDoc.videoId;

    if (!transcript) {
        console.log(`[Job ${jobId}] Fetching transcript from YouTube...`);
        
        // Try the Scraper
        const result = await transcriptService.fetchTranscript(youtubeUrl);
        transcript = result.text;
        videoId = result.videoId;

        // ✅ Count 1 Standard Usage
        await User.findByIdAndUpdate(user._id, { $inc: { monthlyQuotaUsed: 1 } });

        // Save progress
        await Job.findByIdAndUpdate(jobId, { transcript, videoId });
    }
    
    console.log(`✅ Transcript ready (${transcript.length} chars)`);

    // --- STEP 2: GENERATE CONTENT BUNDLE (AI) ---
    console.log(`[Job ${jobId}] Generating Content Bundle with ${userPlan.features.model}...`);
    
    const bundle = await aiService.generateContentBundle(transcript, userPlan.features);
    
    console.log(`✅ Content generated! Blog + Socials created.`);

    // --- STEP 3: SAVE EVERYTHING ---
    await Job.findByIdAndUpdate(jobId, { 
        status: 'completed',
        generatedBlog: bundle.blogPost,
        generatedSocials: {
            linkedin: bundle.linkedinPost,
            twitter: bundle.twitterThread,
            newsletter: bundle.newsletter
        },
        cost: 1 // For our own tracking
    });

    console.log(`🎉 [Job ${jobId}] Finished successfully.`);
    return { status: 'done' };

  } catch (err) {
    console.error(`❌ [Job ${jobId}] Error inside processor:`, err.message);
    // Let the 'failed' handler below take care of the DB update
    throw err; 
  }
};

// 3. Initialize Worker
const worker = new Worker('video-processing', processJob, {
  connection,
  concurrency: 2
});

// 4. Global Error Listeners
worker.on('completed', (job) => {
  console.log(`✨ Job ${job.id} done.`);
});

worker.on('failed', async (job, err) => {
  console.error(`💥 Job ${job.id} failed: ${err.message}`);
  if (job && job.data && job.data.jobId) {
    await Job.findByIdAndUpdate(job.data.jobId, { 
      status: 'failed',
      failedReason: err.message
    });
  }
});

console.log('🚀 Worker System started. Listening for jobs...');