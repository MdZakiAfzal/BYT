const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  youtubeUrl: {
    type: String,
    required: [true, 'YouTube URL is required']
  },
  videoId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['queued', 'processing', 'completed', 'failed'],
    default: 'queued'
  },
  // We store the result here later
  transcript: {
    type: String, // could be long, MongoDB handles it fine
    select: false // Don't return by default to keep API fast
  },
  generatedBlog: {
    type: String,
    select: false 
  },
  failedReason: {
    type: String
  },
  attemptNumber: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Index for faster queries (e.g. "Show me all my jobs")
jobSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Job', jobSchema);