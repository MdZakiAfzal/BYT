const { Queue } = require('bullmq');
const connection = require('../config/redis');

// Create a new queue named 'video-processing'
const videoQueue = new Queue('video-processing', { connection });

exports.addJob = async (jobData) => {
  // jobData will be { jobId: '...', youtubeUrl: '...' }
  // We give the job a name 'process-video'
  await videoQueue.add('process-video', jobData, {
    attempts: 3, // Retry 3 times if it fails
    backoff: {
      type: 'exponential',
      delay: 1000, // Wait 1s, then 2s, then 4s...
    },
    removeOnComplete: true, // Auto-delete from Redis when done (saves memory)
    removeOnFail: false // Keep failed jobs so we can inspect them
  });
};