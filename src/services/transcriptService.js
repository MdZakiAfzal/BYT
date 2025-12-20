const { Innertube, UniversalCache } = require('youtubei.js');
const fs = require('fs');
const path = require('path');

let youtube = null;

const getYoutube = async () => {
  if (youtube) return youtube;

  let cookieString = '';
  try {
    const cookiePath = path.resolve(__dirname, '../../cookies.json');
    if (fs.existsSync(cookiePath)) {
        const cookies = JSON.parse(fs.readFileSync(cookiePath, 'utf8'));
        cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');
        console.log('🍪 [TranscriptService] Cookies loaded.');
    }
  } catch (e) { /* ignore */ }

  youtube = await Innertube.create({
    cache: new UniversalCache(false),
    cookie: cookieString,
    retrieve_player: true // 👈 CRITICAL FIX: Forces fresh player download
  });
  
  return youtube;
};

exports.fetchTranscript = async (url) => {
  console.log(`🔍 Fetching info for: ${url}`);
  const yt = await getYoutube();

  try {
    const videoId = url.match(/[?&]v=([^&]+)/)?.[1] || url.split('/').pop();
    
    // Get Info (This will now use the fresh player)
    const info = await yt.getInfo(videoId);
    
    // Get Transcript
    const transcriptData = await info.getTranscript();

    if (!transcriptData || !transcriptData.transcript) {
        throw new Error("No transcript data found.");
    }

    // Extract text safely
    const text = transcriptData.transcript.content.body.initial_segments
        .map(segment => segment.snippet.text)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

    return { videoId, text };

  } catch (err) {
    console.error(`❌ Plan A (youtubei.js) Failed: ${err.message}`);
    throw err; 
  }
};