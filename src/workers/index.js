const mongoose = require('mongoose');
const fs = require('fs');
const { GoogleAIFileManager } = require("@google/generative-ai/server");
require('dotenv').config();
const { Worker } = require('bullmq');
const connection = require('../config/redis');
const plans = require('../config/plans');
const User = require('../models/userModel');
const Job = require('../models/jobModel');
const youtubeService = require('../services/youtubeService'); // 👈 NEW SERVICE
const aiService = require('../services/aiService');

const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

/* we merged the worker to the api
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('📦 Worker connected to MongoDB'))
  .catch(err => { console.error('❌ DB Error:', err); process.exit(1); });
*/

const processJob = async (job) => {
  const { jobId, youtubeUrl } = job.data;
  console.log(`\n🎬 [Job ${jobId}] Processing started...`);
  
  let tempFilePath = null;

  try {
    await Job.findByIdAndUpdate(jobId, { status: 'processing' });
    const jobDoc = await Job.findById(jobId);
    const user = await User.findById(jobDoc.userId);
    const userPlan = plans[user.plan] || plans.free;

    // --- 1. GET METADATA (via yt-dlp) ---
    const videoData = await youtubeService.getVideoData(youtubeUrl);
    const videoId = videoData.id;
    const durationMins = Math.ceil(videoData.duration / 60);

    if (durationMins > userPlan.maxDuration) {
      throw new Error(`Video is ${durationMins} mins. Limit is ${userPlan.maxDuration} mins.`);
    }

    let inputForAI = ""; 
    let transcript = jobDoc.transcript;

    // --- 2. PLAN A: TRANSCRIPT ---
    if (!transcript) {
        try {
            console.log(`[Job ${jobId}] Trying Plan A: Transcript...`);
            
            transcript = await youtubeService.fetchTranscript(videoData);
            inputForAI = transcript;
            
            await User.findByIdAndUpdate(user._id, { $inc: { monthlyQuotaUsed: 1 } });
            await Job.findByIdAndUpdate(jobId, { transcript, videoId });
            console.log('✅ Plan A Success.');

        } catch (err) {
            console.warn(`⚠️ Plan A Failed (${err.message}). Switching to Plan B...`);

            // --- 3. PLAN B: AUDIO FALLBACK ---
            if (user.whisperQuotaUsed >= userPlan.whisperQuota) {
                throw new Error('Transcript failed and Audio quota exceeded.');
            }

            console.log(`[Job ${jobId}] Downloading Audio (Plan B)...`);
            // yt-dlp handles the download
            tempFilePath = await youtubeService.downloadAudio(youtubeUrl, videoId);

            console.log(`[Job ${jobId}] Uploading audio to Gemini...`);
            const uploadResponse = await fileManager.uploadFile(tempFilePath, {
                mimeType: "audio/mp4",
                displayName: `Job-${jobId}`,
            });

            let file = await fileManager.getFile(uploadResponse.file.name);
            while (file.state === "PROCESSING") {
                await new Promise((r) => setTimeout(r, 2000));
                file = await fileManager.getFile(uploadResponse.file.name);
            }

            if (file.state === "FAILED") throw new Error("Gemini failed to process audio.");

            inputForAI = file.uri;
            await User.findByIdAndUpdate(user._id, { $inc: { whisperQuotaUsed: 1 } });
            console.log('✅ Plan B Success.');
        }
    } else {
        inputForAI = transcript;
    }

    // --- 4. GENERATE CONTENT ---
    console.log(`[Job ${jobId}] Generating Content...`);
    const bundle = await aiService.generateContentBundle(inputForAI, userPlan.features);

    await Job.findByIdAndUpdate(jobId, { 
        status: 'completed',
        generatedBlog: bundle.blogPost,
        generatedSocials: {
            linkedin: bundle.linkedinPost,
            twitter: bundle.twitterThread,
            newsletter: bundle.newsletter
        },
        cost: 1
    });

    console.log(`🎉 [Job ${jobId}] Finished!`);

  } catch (err) {
    console.error(`❌ [Job ${jobId}] Failed:`, err.message);
    await Job.findByIdAndUpdate(jobId, { status: 'failed', failedReason: err.message });
  } finally {
    if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
  }
};

const startWorker = () => {
    const worker = new Worker('video-processing', processJob, { 
      connection, 
      concurrency: 1, // ⚠️ KEEP THIS 1 to save RAM on free tier
      lockDuration: 600000 
    });
    console.log('🚀 Worker System started (Embedded Mode).');
};

module.exports = startWorker;