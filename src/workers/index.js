const mongoose = require('mongoose');
require('dotenv').config();
const { Worker } = require('bullmq');
const connection = require('../config/redis'); // Re-use the Redis config from Phase 4
const Job = require('../models/jobModel'); // We need this to update status

// 1. Connect to MongoDB
// The worker needs its own DB connection to update job statuses
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('📦 Worker connected to MongoDB'))
  .catch(err => {
    console.error('❌ DB Error:', err);
    process.exit(1); // Kill worker if DB fails
  });

// 2. Define the Job Processor
// This function runs every time a job is pulled from the queue
const processJob = async (job) => {
  const { jobId } = job.data;
  console.log(`\n🎬 [Job ${jobId}] Processing started...`);

  // Update Status: Processing
  await Job.findByIdAndUpdate(jobId, { status: 'processing' });

  try {
    // --- PIPELINE STUBS (Step 5.2) ---
    
    // Stub 1: Extract Transcript
    console.log(`[Job ${jobId}] Step 1: Extracting transcript (Stub)...`);
    await new Promise(r => setTimeout(r, 1000)); // Fake 1s delay

    // Stub 2: Generate Blog (AI)
    console.log(`[Job ${jobId}] Step 2: Generating blog (Stub)...`);
    await new Promise(r => setTimeout(r, 1000)); // Fake 1s delay

    // Stub 3: Save Result
    console.log(`[Job ${jobId}] Step 3: Saving result...`);
    // ---------------------------------

    // Update Status: Completed
    await Job.findByIdAndUpdate(jobId, { status: 'completed' });
    console.log(`✅ [Job ${jobId}] Finished successfully.`);
    
    return { status: 'done' };

  } catch (err) {
    // If any step fails, we throw the error so the 'failed' handler catches it
    console.error(`❌ [Job ${jobId}] Error inside processor:`, err.message);
    throw err; 
  }
};

// 3. Initialize the BullMQ Worker
const worker = new Worker('video-processing', processJob, {
  connection,
  concurrency: 2 // How many jobs to process at once?
});

// 4. Global Error Listeners (Step 5.3)
worker.on('completed', (job) => {
  console.log(`🎉 Job ${job.id} completed!`);
});

worker.on('failed', async (job, err) => {
  console.error(`💥 Job ${job.id} failed: ${err.message}`);
  
  // Update DB to Failed
  // We use job.data.jobId because 'job' is the BullMQ job, not our DB document
  if (job && job.data && job.data.jobId) {
    await Job.findByIdAndUpdate(job.data.jobId, { 
      status: 'failed',
      failedReason: err.message
    });
  }
});

console.log('🚀 Worker System started. Listening for jobs...');