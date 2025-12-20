const { exec } = require('child_process');
const util = require('util');
const fs = require('fs');
const path = require('path');
const execPromise = util.promisify(exec);

// Helper to run yt-dlp commands
const runYtDlp = async (args) => {
    // Increase buffer to 10MB because YouTube JSON is huge
    const { stdout } = await execPromise(`yt-dlp ${args}`, { maxBuffer: 1024 * 1024 * 10 });
    return stdout;
};

exports.getVideoData = async (url) => {
    console.log(`🔍 [yt-dlp] Fetching metadata: ${url}`);
    
    // 1. Fetch Metadata & Transcript URL
    // --dump-json: Gets all info
    // --no-playlist: Ensures we only get one video
    const jsonOutput = await runYtDlp(`--dump-json --no-playlist "${url}"`);
    const data = JSON.parse(jsonOutput);
    
    return data;
};

exports.downloadAudio = async (url, videoId) => {
    console.log(`mic [yt-dlp] Downloading Audio: ${url}`);
    const outputPath = path.join('/tmp', `temp-${videoId}.m4a`);

    // 2. Download Audio
    // -f bestaudio[ext=m4a]: Gets native audio (no conversion needed)
    // -o: Output path
    await runYtDlp(`-f "bestaudio[ext=m4a]/bestaudio" -o "${outputPath}" "${url}"`);
    
    if (!fs.existsSync(outputPath)) {
        throw new Error("Audio file not found after download.");
    }
    
    return outputPath;
};

exports.fetchTranscript = async (data) => {
    // 3. Extract Transcript from Metadata
    // yt-dlp returns 'automatic_captions' or 'subtitles'
    const captions = data.automatic_captions || data.subtitles;
    
    if (!captions || !captions.en) {
        throw new Error("No English captions found.");
    }

    // Get the 'json3' format URL (cleanest structure)
    const jsonFormat = captions.en.find(c => c.ext === 'json3') || captions.en[0];
    const transcriptUrl = jsonFormat.url;

    console.log(`📜 [yt-dlp] Fetching transcript JSON...`);
    
    // Fetch the actual text
    const response = await fetch(transcriptUrl);
    const transcriptData = await response.json();

    // Parse it
    const text = transcriptData.events
        .filter(e => e.segs)
        .map(e => e.segs.map(s => s.utf8).join(''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

    return text;
};