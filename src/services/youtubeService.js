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
    const jsonOutput = await runYtDlp(`--dump-json --no-playlist "${url}"`);
    return JSON.parse(jsonOutput);
};

// 🆕 UPDATED: Accepts limitSeconds to download only part of the audio
exports.downloadAudio = async (url, videoId, limitSeconds = null) => {
    console.log(`🎤 [yt-dlp] Downloading Audio: ${url} ${limitSeconds ? `(Limit: ${limitSeconds}s)` : ''}`);
    const outputPath = path.join('/tmp', `temp-${videoId}.m4a`);

    // Build arguments
    let args = `-f "bestaudio[ext=m4a]/bestaudio" -o "${outputPath}"`;
    
    // ✂️ PARTIAL DOWNLOAD LOGIC
    if (limitSeconds) {
        // syntax: --download-sections "*00:00-00:15:00" (start-end)
        // We use timestamp in seconds
        args += ` --download-sections "*0-inf" --downloader ffmpeg --downloader-args "ffmpeg_i:-t ${limitSeconds}"`; 
        // Note: reliable truncation often requires ffmpeg args or post-processing, 
        // but passing "-t" to ffmpeg is the cleanest way with yt-dlp.
    }

    await runYtDlp(`${args} "${url}"`);
    
    if (!fs.existsSync(outputPath)) {
        throw new Error("Audio file not found after download.");
    }
    
    return outputPath;
};

// 🆕 UPDATED: Accepts limitSeconds to filter transcript text
exports.fetchTranscript = async (data, limitSeconds = null) => {
    const captions = data.automatic_captions || data.subtitles;
    
    if (!captions || !captions.en) {
        throw new Error("No English captions found.");
    }

    const jsonFormat = captions.en.find(c => c.ext === 'json3') || captions.en[0];
    
    console.log(`📜 [yt-dlp] Fetching transcript JSON...`);
    const response = await fetch(jsonFormat.url);
    const transcriptData = await response.json();

    // Limit in milliseconds
    const limitMs = limitSeconds ? limitSeconds * 1000 : Infinity;

    const text = transcriptData.events
        // ✂️ PARTIAL TRANSCRIPT LOGIC
        .filter(e => !limitSeconds || (e.tStartMs || 0) < limitMs) 
        .filter(e => e.segs)
        .map(e => e.segs.map(s => s.utf8).join(''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

    return text;
};