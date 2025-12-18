const { YoutubeTranscript } = require('youtube-transcript');
const AppError = require('../utils/AppError');

// 1. Helper to extract Video ID
const extractVideoId = (url) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

exports.fetchTranscript = async (url) => {
  const videoId = extractVideoId(url);
  if (!videoId) throw new AppError('Invalid YouTube URL', 400);

  console.log(`🔍 Fetching transcript for video: ${videoId}`);

  try {
    // STRATEGY: Try strict 'en', then fallback to auto
    // We try specifically 'en' first because your log showed it existed
    const configList = [
      { lang: 'en' }, 
      undefined // Auto-detect as backup
    ];

    let transcriptItems = null;

    for (const config of configList) {
      try {
        transcriptItems = await YoutubeTranscript.fetchTranscript(videoId, config);
        if (transcriptItems && transcriptItems.length > 0) break;
      } catch (e) { /* ignore and try next */ }
    }

    if (!transcriptItems || transcriptItems.length === 0) {
      throw new Error('All scrape attempts failed');
    }

    // Success! Clean it up.
    const fullText = transcriptItems
      .map(item => item.text)
      .join(' ')
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return { videoId, text: fullText };

  } catch (err) {
    console.error(`❌ Real Scrape Failed: ${err.message}`);
    console.log(`⚠️ SWITCHING TO MOCK MODE (For Development Only)`);
    
    // FALLBACK: Return dummy text so you can test Phase 7 (AI)
    // This ensures your workflow doesn't stop just because YouTube is blocking IP
    return { 
        videoId, 
        text: MOCK_TRANSCRIPT 
    };
  }
};

// --- MOCK DATA FOR DEV ---
const MOCK_TRANSCRIPT = `
This is a sample transcript because the YouTube scraper was blocked. 
In a real production environment, we would use a paid proxy API. 
But for now, let's pretend this is a video about Artificial Intelligence.

Artificial Intelligence (AI) is transforming the world. 
It helps us code faster, generate art, and even drive cars.
The key to AI is machine learning, where computers learn from data instead of being explicitly programmed.
This video covers three main points:
1. What is LLM (Large Language Model)?
2. How does it work?
3. The future of SaaS.
Thank you for watching, and don't forget to subscribe!
`;